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

    python convert.py demos/IWTC.qtz iwtc.mp3 > IWTC_audio.html
    python convert.py demos/IWTC.qtz iwtc.mp3 debug > IWTC_audio_debug.html
    python convert.py demos/IWTC.qtz none debug > IWTC_debug.html
