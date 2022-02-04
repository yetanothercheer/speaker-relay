# NOTE:
# Async? Quart? Flask?
# https://www.balajeerc.info/Rooting-out-CPU-Bottlenecks-from-asyncio-based-API-services/

import asyncio
from functools import partial
import sys
import threading
import time

from aiohttp import web
import numpy as np
import socketio
import soundcard as sc
import os
from pathlib import Path

PACKAGE_SOURCE_DIR = Path(__file__).parent
os.chdir(PACKAGE_SOURCE_DIR)
print(f"PACKAGE_SOURCE_DIR: {PACKAGE_SOURCE_DIR}")

@web.middleware
async def cache_control(request: web.Request, handler):
    response: web.Response = await handler(request)
    if request.url.path.endswith((".jsx", ".html")):
        print(f"{request.url.path}")
        response.headers.setdefault('Cache-Control', 'no-cache')
    return response

sio = socketio.AsyncServer(cors_allowed_origins='*')
app = web.Application(middlewares=[cache_control])
sio.attach(app)
app.router.add_static('/', 'static')

# Main thread event loop
loop = None

# On Windows, this weird thing would keep audio stream stable.
def phantom_speaker():
    print(f"! Phantom Speaker Start {threading.get_ident()}")
    fake = np.zeros(441000)
    default_speaker = sc.default_speaker()
    while True:
        default_speaker.play(fake, samplerate=44100)

# Recording task.
def recorder():
    global loop
    print(f"! Recorder Start {threading.get_ident()}")
    microphones = sc.all_microphones(include_loopback=True)
    if len(microphones) < 1:
        print("No microphone.")
        sys.exit(1)

    microphone = microphones[0]
    print(f"! Choose microphone: {microphone}")

    numframes = 512
    with microphone.recorder(samplerate=44100, blocksize=numframes*4) as mic:
        while True:
            time_stamp = time.time()
            data = mic.record(numframes=numframes).astype(np.float32)
            push_data = { "time": time_stamp, "data": data.T.tobytes() }
            if loop != None:
                asyncio.run_coroutine_threadsafe(
                    sio.emit('push', push_data, room='public'), loop
                )


@sio.event
async def connect(sid, environ):
    global loop
    loop = asyncio.get_running_loop()
    print("Connect ", sid)
    sio.enter_room(sid, 'public')

@sio.event
async def ping(sid, data):
    await sio.emit('ping', {'time': time.time()})

@sio.event
async def disconnect(sid):
    print('Disconnect ', sid)
    sio.leave_room(sid, 'public')

def main():
    threading.Thread(target=phantom_speaker, daemon=True).start()
    threading.Thread(target=recorder, daemon=True).start()
    web.run_app(app)

main()