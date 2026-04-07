"use strict";
/// <reference path="../csgo.d.ts" />
var Async;
(function (Async) {
    function Delay(fDelay, value) {
        return new Promise(resolve => $.Schedule(fDelay, () => resolve(value)));
    }
    Async.Delay = Delay;
    function NextFrame() {
        return Delay(0.0);
    }
    Async.NextFrame = NextFrame;
    function UnhandledEvent(sEvent) {
        return new Promise(resolve => {
            const nHandlerId = $.RegisterForUnhandledEvent(sEvent, function (...args) {
                $.UnregisterForUnhandledEvent(sEvent, nHandlerId);
                resolve(args);
            });
        });
    }
    Async.UnhandledEvent = UnhandledEvent;
    class AbortController {
        signal;
        _aborted = false;
        constructor() {
            const controller = this;
            this.signal = { get aborted() { return controller._aborted; } };
        }
        abort() {
            this._aborted = true;
        }
    }
    Async.AbortController = AbortController;
    function Condition(predicate, abortSignal) {
        return new Promise(resolve => {
            (async function () {
                while (abortSignal === undefined || !abortSignal.aborted) {
                    if (predicate()) {
                        resolve();
                        return;
                    }
                    await NextFrame();
                }
            })();
        });
    }
    Async.Condition = Condition;
    function RunSequence(sequenceFn, abortSignal) {
        return new Promise(resolve => {
            (async function () {
                const generator = sequenceFn(abortSignal || new Async.AbortController().signal);
                let value;
                while (true) {
                    const iterResult = await generator.next(value);
                    if (iterResult.done) {
                        resolve(true);
                        return;
                    }
                    value = await iterResult.value;
                    if (abortSignal && abortSignal.aborted) {
                        resolve(false);
                        return;
                    }
                }
            })();
        });
    }
    Async.RunSequence = RunSequence;
    class TimeStamp {
        frameTime = $.FrameTime();
        Schedule(fDelay, fn) {
            const fDelayFromNow = fDelay - ($.FrameTime() - this.frameTime);
            $.Schedule(fDelayFromNow, fn);
        }
        Delay(fDelay, value) {
            return new Promise(resolve => this.Schedule(fDelay, () => resolve(value)));
        }
    }
    Async.TimeStamp = TimeStamp;
})(Async || (Async = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN5bmMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9jb21tb24vYXN5bmMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUVyQyxJQUFVLEtBQUssQ0EySmQ7QUEzSkQsV0FBVSxLQUFLO0lBVVgsU0FBZ0IsS0FBSyxDQUFNLE1BQWMsRUFBRSxLQUFTO1FBRWhELE9BQU8sSUFBSSxPQUFPLENBQUssT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUUsS0FBTSxDQUFFLENBQUUsQ0FBRSxDQUFDO0lBQ3RGLENBQUM7SUFIZSxXQUFLLFFBR3BCLENBQUE7SUFLRCxTQUFnQixTQUFTO1FBRXJCLE9BQU8sS0FBSyxDQUFFLEdBQUcsQ0FBRSxDQUFDO0lBQ3hCLENBQUM7SUFIZSxlQUFTLFlBR3hCLENBQUE7SUFNRCxTQUFnQixjQUFjLENBQW9DLE1BQVM7UUFFdkUsT0FBTyxJQUFJLE9BQU8sQ0FBRSxPQUFPLENBQUMsRUFBRTtZQUUxQixNQUFNLFVBQVUsR0FBRyxDQUFDLENBQUMseUJBQXlCLENBQUssTUFBTSxFQUFFLFVBQVcsR0FBRyxJQUFvQjtnQkFFekYsQ0FBQyxDQUFDLDJCQUEyQixDQUFFLE1BQU0sRUFBRSxVQUFVLENBQUUsQ0FBQztnQkFDcEQsT0FBTyxDQUFFLElBQUksQ0FBRSxDQUFDO1lBQ3BCLENBQXdDLENBQUUsQ0FBQztRQUMvQyxDQUFDLENBQUUsQ0FBQztJQUNSLENBQUM7SUFWZSxvQkFBYyxpQkFVN0IsQ0FBQTtJQWFELE1BQWEsZUFBZTtRQUV4QixNQUFNLENBQWdCO1FBQ2QsUUFBUSxHQUFHLEtBQUssQ0FBQztRQUN6QjtZQUVJLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQztZQUN4QixJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsSUFB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