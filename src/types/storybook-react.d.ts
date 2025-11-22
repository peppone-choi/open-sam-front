declare module '@storybook/react' {
  export type Meta<T = any> = {
    title?: string;
    component: T;
    decorators?: Array<(Story: any, context: Record<string, unknown>) => unknown>;
    parameters?: Record<string, unknown>;
    render?: (...args: any[]) => unknown;
    [key: string]: unknown;
  };

  export type StoryObj<T = any> = {
    args?: Record<string, unknown>;
    render?: (...args: any[]) => unknown;
    parameters?: Record<string, unknown>;
    decorators?: Array<(Story: any, context: Record<string, unknown>) => unknown>;
    [key: string]: unknown;
  };
}
