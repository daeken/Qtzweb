Qtzweb
======

Quartz Composer to JS/WebGL compiler

Installation
============

    sudo easy_install biplist yaml

Running
=======

convert.py is the main file for the compiler.

Example usage: `python convert.py demos/IWTC.qtz > IWTC.html`

You can also pass in the name of an audio file to be synced with the animation (it will be used as the timebase for the animation) after the qtz file.
After that, you can pass any value to enable debugging.

    python convert.py demos/IWTC.qtz iwtc > IWTC_audio.html
    python convert.py demos/IWTC.qtz iwtc debug > IWTC_audio_debug.html
    python convert.py demos/IWTC.qtz none debug > IWTC_debug.html

When passing an audio file (e.g. not `none`), it will automatically assume that you have both an mp3 and ogg version of the track. (XXX: Fixme)