import soundcard as sc
from queue import Queue
from time import time, sleep
from flask import Flask, send_file
from flask_socketio import SocketIO, emit
import numpy as np
import os, sys
# import scipy.io.wavfile

audio_queue = Queue()
should_stop = False

# Recording Task
def recorder():
    print("! Recorder Start")
    microphones = sc.all_microphones(include_loopback=True)
    if len(microphones) < 1:
        print("No microphone.")
        sys.exit(1)

    microphone = microphones[0]
    print(f"! Choose microphone: {microphone}")

    numframes = 512
    with microphone.recorder(samplerate=44100, blocksize=numframes*4) as mic:
        # count = 0
        # buf = None
        while not should_stop:
            time_stamp = time()
            data = mic.record(numframes=numframes).astype(np.float32)
            audio_queue.put_nowait((data, time_stamp))
        print("! Stop Recording...")

# Sending Task
def server_push():
    print("! Server Push Start")
    i = 1
    with app.app_context():
        while not should_stop:
            (data, time_stamp) = audio_queue.get()
            emit("listen!", { "index": i, "time": time_stamp, "data": data.T.tobytes() }, broadcast=True, namespace="/")
            i += 1
        print("! Stop Pushing...")

os.environ["FLASK_ENV"] = "debug"
app = Flask(__name__, static_url_path='/', static_folder='static')
socketio = SocketIO(app)

# Help client estimate time difference
@socketio.on('time')
def handle_time(data):
    emit("time", {'time': time()})

# connection count
clients = 0

@socketio.on('connect')
def handle_connect(data):
    global clients
    clients += 1
    print(f"[CONNECT]\t{clients}") 

@socketio.on('disconnect')
def handle_disconnect():
    global clients
    clients -= 1
    print(f"[DISCONNECT]\t{clients}") 

# Send webpage
@app.route("/")
def index():
    return send_file("./index.html")

import eventlet
eventlet.monkey_patch()

import sys
import signal
def handler(signal, frame):
    global should_stop
    should_stop = True
    sleep(1)
    sys.exit(0)
signal.signal(signal.SIGINT, handler)

if __name__ == '__main__':
    socketio.start_background_task(target=server_push)
    socketio.start_background_task(target=recorder)
    socketio.run(app, host="127.0.0.1", port=5000)
