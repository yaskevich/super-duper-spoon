import type { MenuOption } from 'naive-ui';

declare global {
  interface keyable {
    [key: string]: any;
  }

  interface IUser {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
    email: string;
    sex: number;
    server: string;
    commit: string;
    unix: number;
    privs: number;
    activated: boolean;
    requested: Date;
    token: string;
    queries: Array<string>;
  }

  interface IState {
    token?: string;
    title: string;
    error?: string;
    user?: IUser;
    nav: {
      options: Array<MenuOption>;
      key: string;
    };
  }

  interface ISettings {
    registration_open: boolean;
  }

  interface ISuggestion {
    id: number;
    title: string;
    lid: number;
  }
}
