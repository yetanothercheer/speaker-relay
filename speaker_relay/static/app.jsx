// CAUTION! : CDN VERSION & TYPE VERSION MAY CAUSE PROBLEM. 

// SOME JS DIRTIES.
// https://stackoverflow.com/questions/42100659/why-in-javascript-class-a-instanceof-function-but-typeof-class-a-is-not-an-obje
// https://stackoverflow.com/questions/37107766/setting-values-to-proto-and-prototype-in-javascript
// https://stackoverflow.com/questions/9959727/proto-vs-prototype-in-javascript#:~:text=prototype%20is%20a%20property%20of,standards%20provide%20an%20equivalent%20Object.
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new#description
// WE CAN EVEN WRITE THIS NOW:
Function.prototype.partial = function (...args) {
    return (...rest) => this(...args, ...rest);
}

/**
 * WebSocket OR SocketIO
 * https://stackoverflow.com/questions/10112178/differences-between-socket-io-and-websockets
 * https://websockets.readthedocs.io/en/stable/intro/tutorial2.html#broadcast
 * SocketIO is more handy.
 * 
 * Since we use Babel, why not add new syntax, like pattern maching, option or rust-like staff.
 * 
// Rxjs
// https://stackblitz.com/
// https://github.dev/ReactiveX/rxjs/

// Use Material !
// https://sass-lang.com/documentation/syntax#:~:text=The%20SCSS%20syntax%20uses%20the,to%20and%20the%20most%20popular.
// https://github.com/material-components/material-components-web
// New Web Component: https://github.com/material-components/material-web

// Write a `useQuery()`?
// https://react-query.tanstack.com/guides/queries
 */

// let TEST_FILTER = new URL(window.location.href).searchParams.get("test");

/**
 * <script type="_">lib.jsx</script>
 * <script type="_">test.jsx</script>
 * <script>
 * execute lib.jsx
 * if (test) {
 *  execute test.jsx
 * } else {
 *  execute main();
 * }
 * </script>
 */
// register a plugin, visit all TestClass, and execute them.
// https://github.com/babel/babel/tree/master/packages/babel-standalone/src

/**
 * HOW TO WRITE SAFE JS?
 */

// class TestBase {
//     constructor() {
//         if (TEST_FILTER) {
//             let name = this.constructor.name;
//             const getMethods = (obj) => {
//                 let properties = new Set()
//                 let currentObj = obj
//                 do {
//                     Object.getOwnPropertyNames(currentObj).map(item => properties.add(item))
//                 } while ((currentObj = Object.getPrototypeOf(currentObj)))
//                 return [...properties.keys()].filter(item => typeof obj[item] === 'function')
//             };
//             console.log(`${name}`);
//             console.log(getMethods(this).filter(s => s.startsWith('test')));
//         }
//     }
// }


let PLAY_DELAY = "PLAY_DELAY";
function log(message) {
    const _reserve = (s, digits) => {
        return `${s}`.length >= digits ? s :
            _reserve(`${s}0`, digits);
    }
    let date = new Date();
    let date_string = `${_reserve(date.getHours(), 2)}:${_reserve(date.getMinutes(), 2)}:${_reserve(date.getSeconds(), 2)}:${_reserve(date.getMilliseconds(), 3)}`;
    _log.innerHTML = `${date_string} ${message}<br/>` + _log.innerHTML.slice(0, 2000)
}

/**
 * rxjs is awesome! 
 * https://www.learnrxjs.io/learn-rxjs/operators/transformation/reduce
 */
// Subject Must Not Be Created In Side Functional Component
function FromSubject(subject) {
    let [state, setState] = React.useState({
        subject, data: subject.getValue ? subject.getValue() : "NO DEFAULT VALUE"
    });
    React.useEffect(() => {
        console.log("Set Up Subscribler For Each Subject");
        // skip so won't cause rerender of BehaviorSubject's default value
        subject.pipe(rxjs.pipe(rxjs.skip(1))).subscribe(v => setState({
            subject,
            data: v
        }));
        return () => {
            console.log("Last Run");
        }
    }, []);
    return {
        ...state
    };
}

class AudioRecevier {
    connect() {
        this.socket = io()
        this.timeDiff()
        this.timeDiffSubject.pipe(rxjs.operators.take(1)).subscribe(() => {
            this.listen();
        });
        this.SettingSubject.subscribe((object) => {
            log(`${JSON.stringify(object)}`)
            Object.keys(object).forEach(k => {
                let v = object[k];
                if (k === "status") {
                    if (v === "start") {
                        this.context = new AudioContext({
                            numberOfChannels: 2,
                            sampleRate: 44100,
                        });
                        this.context.myGain = this.context.createGain();
                        // CAUTION: exponentialRampToValueAtTime require value to be positive
                        this.context.myGain.gain.value = 0.001;
                    }
                    if (v === "stop") {
                        let old_context = this.context;
                        old_context.myGain.gain.linearRampToValueAtTime(0.01, old_context.currentTime + 0.1);

                        setTimeout(() => {
                            old_context.close();
                        }, this.context.currentTime + 0.1)

                        this.context = null;
                        this.last_time = 0;
                        this.next_time = 0;
                    }
                }
                if (k === "play_delay") {
                    if (this.context) {
                        let remain = this.next_time - this.context.currentTime;
                        this.context.myGain.gain.exponentialRampToValueAtTime(0.001, Math.min(remain, 0.1));
                        this.next_time = 0;
                    }
                }
            })
        });
    }

    timeDiffSubject = new rxjs.BehaviorSubject();

    timeDiff() {
        let time_a;
        let diffs = [];
        this.socket.on('ping', (message) => {
            let time_b = Date.now();
            let time_remote = message.time;
            // NOTE: diff = BrowserTime - RemoteTime
            let diff_sample = (time_a + time_b) / 2000 - time_remote;
            diffs.push(diff_sample);

            let round = (time_b - time_a);
            log(`Roundtrip: ${round}ms`);

            if (diffs.length < 10) {
                time_a = Date.now()
                this.socket.emit("ping", null);
            } else {
                // reduce error
                diffs.sort();
                // diffs = diffs.slice(10, 40);
                let diff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
                this.timeDiffSubject.next(diff);
            }
        });

        time_a = Date.now();
        this.socket.emit("ping", null);
    }


    DeltaSubject = new rxjs.BehaviorSubject()
    BetterDeltaSubject = this.DeltaSubject.pipe(
        rxjs.bufferTime(1000),
        rxjs.map((deltas) => {
            let len = deltas.length;
            if (len == 0) {
                return {
                    max: 0,
                    min: 0,
                    avg: 0,
                    count: 0
                }
            }
            let { max, min, avg } = deltas.reduce(({ max, min, avg }, delta) => {
                return {
                    max: delta > max ? delta : max,
                    min: delta < min ? delta : min,
                    avg: avg + delta / len,
                }
            }, {
                max: 0,
                min: 1000000,
                avg: 0
            });
            return {
                max: max.toFixed(2),
                min: min.toFixed(2),
                avg: avg.toFixed(2),
                count: len
            };
        })
    )

    SettingSubject = new rxjs.BehaviorSubject({
        play_delay: 0.5
    })

    AllSettings = new rxjs.BehaviorSubject({})

    constructor() {
        this.SettingSubject.pipe(
            rxjs.scan((a, v) => {
                console.log(`Update ${JSON.stringify(v)}`)
                return { ...a, ...v };
            }, {})
        ).subscribe(all => {
            this.AllSettings.next(all);
        })
    }


    reset_indicator = false
    next_time = 0;
    reset_time = null;
    // Web Audio streaming with fetch API
    // https://gist.github.com/revolunet/e620e2c532b7144c62768a36b8b96da2
    async createSoundSource(audioData, time, index) {
        if (!this.context || this.context.state != "running") return;

        if (this.reset_indicator) {
            console.log("???")
        }

        for (var i = 0; i < audioData.length; i++) {
            let channel_len = audioData[i].length / 2;
            let duration = channel_len / 44100;
            let c1 = audioData[i].slice(0, channel_len);
            let c2 = audioData[i].slice(channel_len);

            let audioCtx = this.context;
            let context = this.context;
            var myArrayBuffer = audioCtx.createBuffer(2, channel_len, audioCtx.sampleRate);
            myArrayBuffer.copyToChannel(c1, 0);
            myArrayBuffer.copyToChannel(c2, 1);

            var source = audioCtx.createBufferSource();
            source.buffer = myArrayBuffer;

            source.connect(this.context.myGain);
            this.context.myGain.connect(audioCtx.destination);
            // }

            let play_delay = this.AllSettings.getValue().play_delay;

            const adjust_delay = () => {
                this.reset_time = Date.now();
                this.next_time = 0;
            }

            // log(this.next_time)
            if (this.next_time == 0 || this.reset_indicator) {
                log(`First ${context.currentTime}`)
                let currentTime = this.context.currentTime;
                setTimeout(() => {
                    this.context.myGain.gain.exponentialRampToValueAtTime(1, currentTime + play_delay + play_delay);
                }, play_delay);
                this.next_time = context.currentTime + this.AllSettings.getValue().play_delay;
            }

            log(`Play ${this.next_time}, ${this.next_time - context.currentTime}s after.`)
            if (this.context.state === "running") {
                source.start(this.next_time);
            }

            let delay = this.next_time - context.currentTime + Date.now() / 1000.0 - (time);

            this.next_time += duration;
            let remain = this.next_time - context.currentTime;
            if (remain - play_delay < -0.1) {
                // reset when remain duration goes away.
                log(`REMAIN TOO SMALL: ${remain} ${play_delay}`);
                adjust_delay();
            }


            // THERE TWO LINES ARE SYNCHRONOUS.
            // this.SettingSubject.next({ delay: delay });
            // this.SettingSubject.next({ remain: remain });
        }
    }

    last_time = 0;
    listen() {
        this.socket.on('push', (message) => {
            if (this.last_time != 0) {
                let delta = Date.now() - this.last_time;
                this.DeltaSubject.next(delta);
            }
            this.createSoundSource([new Float32Array(message.data)], message.time + this.timeDiffSubject.getValue(), message.index);
            this.last_time = Date.now();
        });
    }
}

let av = new AudioRecevier();
av.connect();

const App = () => {
    let delta = FromSubject(av.BetterDeltaSubject).data;

    let settingSubject = FromSubject(av.SettingSubject).subject;
    let allSettings = FromSubject(av.AllSettings).subject;

    let btnConfig = av.context ? {
        click: () => { settingSubject.next({ status: "stop" }); },
        text: "pause",
    } : {
        click: () => { settingSubject.next({ status: "start" }) },
        text: "play_arrow"
    };

    React.useEffect(() => {
        Array.from(document.querySelectorAll('.mdc-button')).forEach(mdc.ripple.MDCRipple.attachTo)
    }, []);

    let addBtn = () => settingSubject.next({ play_delay: +(allSettings.value.play_delay + 0.1).toFixed(1) });
    let minusBtn = () => settingSubject.next({ play_delay: +(allSettings.value.play_delay - 0.1).toFixed(1) });

    return <main>
        <button type="button" playing={`${btnConfig.text === "Stop"}`} onClick={btnConfig.click}
            className="mdc-button mdc-button--raised mdc-button--unelevated" id="btn">
            <div className="mdc-button__ripple"></div>
            <span className="mdc-button__label">
                <span class="material-icons">
                    {btnConfig.text}
                </span>
            </span>
        </button>

        <div className="data">
            <p><span className="title">Required Delay</span>
                <span className="title" x-text="$store.setting.play_delay">{allSettings.value.play_delay}s</span>
                <span style={{ position: "absolute", transform: "translateY(-5px)" }}>
                    <button className="mdc-button" onClick={addBtn} type="button">
                        <div className="mdc-button__ripple"></div>
                        <span className="mdc-button__label">➕</span>
                    </button>
                    <button className="mdc-button" onClick={minusBtn} type="button">
                        <div className="mdc-button__ripple"></div>
                        <span className="mdc-button__label">➖</span>
                    </button>
                </span>
            </p>
            {/* <p><span className="title">Real Delay</span>
                <span className="title">{allSettings.value.delay}</span>
            </p>
            <p><span className="title">Remaining Duration</span>
                <span className="title">{allSettings.value.remain}</span>
            </p> */}
            {/* <p>
                <span className="title">Clock Difference</span>
                <span className="title">{data}</span>
            </p> */}
            <p>
                <span className="title">Average Delta</span>
                <span className="title">{delta.avg}ms
                    <span style={{ whiteSpace: "pre" }}>  </span>
                    <span style={{ fontSize: "0.7em" }}>
                        ({delta.min}~{delta.max}ms)
                    </span>
                </span>
            </p>
            <p>
                <span className="title">Count Per Sec</span>
                <span className="title">{delta.count} ({delta.count * 2 * 512 / 1024}KBps)</span>
            </p>
        </div>
    </main >;
};

ReactDOM.render(<App />, document.getElementById("root"));
