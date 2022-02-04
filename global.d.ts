import * as _rxjs from "rxjs"
import { io as _io } from "socket.io-client"

declare global {
    const rxjs: typeof _rxjs;
    const io: typeof _io;
}
