"""Assemble the original Poslovitch recordings into 110 portable MP3 phrases.

Requires Python 3 and ffmpeg. Source files and their provenance are committed.
Do not run during the ordinary web build: browser/CI needs only the shipped MP3s.
"""
import array
import json
import pathlib
import subprocess
import tempfile
import wave

ROOT = pathlib.Path(__file__).resolve().parent.parent
RATE = 24000
SOURCES = json.loads((ROOT / 'public' / 'audio' / 'sources.json').read_text())
SOURCE_FILES = {('plus' if source['word'] == '+' else source['word']): source['file'] for source in SOURCES}


def word(name):
    decoded = subprocess.run([
        'ffmpeg', '-v', 'error', '-i', str(ROOT / 'audio-sources' / SOURCE_FILES[name]),
        '-f', 's16le', '-ac', '1', '-ar', str(RATE), '-'
    ], check=True, capture_output=True).stdout
    samples = array.array('h', decoded)
    # Keep just 30 ms around speech so assembled words form one fluid phrase.
    audible = [i for i, value in enumerate(samples) if abs(value) > 230]
    if not audible:
        raise ValueError(f'Empty recording: {name}')
    padding = int(RATE * .03)
    samples = samples[max(0, audible[0] - padding):min(len(samples), audible[-1] + padding)]
    # Equalize word volume without clipping and with a modest noise floor.
    scale = min(3, 24000 / max(abs(value) for value in samples))
    return array.array('h', (round(value * scale) for value in samples))


def silence(seconds):
    return array.array('h', [0]) * round(RATE * seconds)


def main():
    words = {str(i): word(str(i)) for i in range(21)}
    words['plus'] = word('plus')
    output = ROOT / 'public' / 'audio'
    output.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='jardin-audio-') as temp:
        intermediate = pathlib.Path(temp) / 'phrase.wav'
        for a in range(1, 11):
            for b in range(11):
                # "trois plus cinq, huit": a longer pause introduces the result.
                phrase = silence(.05) + words[str(a)] + words['plus'] + words[str(b)] + silence(.25) + words[str(a + b)] + silence(.1)
                with wave.open(str(intermediate), 'wb') as wav:
                    wav.setnchannels(1)
                    wav.setsampwidth(2)
                    wav.setframerate(RATE)
                    wav.writeframes(phrase.tobytes())
                subprocess.run([
                    'ffmpeg', '-v', 'error', '-y', '-i', str(intermediate),
                    '-af', 'atempo=1.08', '-codec:a', 'libmp3lame', '-b:a', '64k', '-map_metadata', '-1',
                    str(output / f'{a}-{b}.mp3')
                ], check=True)
    sources = json.loads((output / 'sources.json').read_text())
    credits = ['Le Jardin des additions — crédits sonores', '',
        'Voix et enregistrements : Poslovitch, projet Lingua Libre.',
        'Profil : https://lingualibre.org/wiki/Q142683',
        'Adaptations : silences raccourcis, volume harmonisé, assemblage, tempo accéléré de 8 % sans changement de hauteur, conversion MP3.',
        'Lecture : premier nombre, « plus », second nombre, pause, résultat.',
        'Aucune voix de synthèse. Les enregistrements sources sont dans audio-sources/.',
        'Les nombres 0 à 19 sont les WAV originaux ; 20 et « + » utilisent les transcodages Ogg officiels de Wikimedia.', '']
    for source in sources:
        credits.extend([f"{source['word']} — {source['speaker']} — {source['license']}", source['source'], source['licenseUrl'], ''])
    (output / 'CREDITS.txt').write_text('\n'.join(credits) + '\n')
    print('Created 110 spoken additions, with source credits.')


if __name__ == '__main__':
    main()
