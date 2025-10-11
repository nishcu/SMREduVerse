'use client';

import { EventEmitter } from 'events';

// It's a bit of a hack to use 'events' but it's a small dependency and works well for this.
class ErrorEmitter extends EventEmitter {}

export const errorEmitter = new ErrorEmitter();
