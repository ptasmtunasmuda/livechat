// Global type definitions for the project

declare module '*.vue' {
    import type { DefineComponent } from 'vue';
    const component: DefineComponent<{}, {}, any>;
    export default component;
}

declare global {
    interface Window {
        Echo: any;
        Pusher: any;
    }
}

export {};
