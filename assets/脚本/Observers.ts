/**
 * @File   : Observers.ts
 * @description: This file defines the Observers class.
 * @Author : 小明哥哥
 * */
/**
 * A Singleton class implementing the Observer pattern for event handling.
 * 
 * @class Observers
 * @description Manages event subscriptions and notifications between different parts of the application
 * 
 * @property {Array} planes - Array to store plane objects
 * @property {Object.<string, Function[]>} observers - Dictionary storing event callbacks
 * @property {Observers} instance - Static instance for Singleton pattern
 * 
 * @method getInstance - Returns the singleton instance of Observers
 * @method addObserver - Registers a callback for a specific event
 * @method removeObserver - Unregisters a callback from a specific event
 * @method notify - Triggers all callbacks registered for a specific event
 * 
 * @example
 * const observer = Observers.getInstance();
 * observer.addObserver('eventName', callback);
 * observer.notify('eventName', arg1, arg2);
 * observer.removeObserver('eventName', callback);
 */
export default class Observers {
    private observers: { [key: string]: Function[] } = {};
    private static instance: Observers;
    private constructor() {}
    public static getInstance(): Observers {
        if (!Observers.instance) {
            Observers.instance = new Observers();
        }
        return Observers.instance;
    }
    public addObserver(event: string, callback: Function): void {
        if (!this.observers[event]) {
            this.observers[event] = [];
        }
        this.observers[event].push(callback);
    }
    public removeObserver(event: string, callback: Function): void {
        if (this.observers[event]) {
            this.observers[event] = this.observers[event].filter(cb => cb !== callback);
        }
    }
    public notify(event: string, ...args: any[]): void {
        if (this.observers[event]) {
            this.observers[event].forEach(callback => callback(...args));
        }
    }
}

