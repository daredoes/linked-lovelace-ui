export const log = (msg: any, ...values: any[]): void => {
  /* eslint no-console: 0 */
  console.info(
    `%c  LINKED-LOVELACE-UI \n%c  ${msg}   `,
    'color: orange; font-weight: bold; background: black',
    'font-weight: bold;',
    ...values,
  );
};

export const toConsole = (func: 'info' | 'error' | 'warn', msg: any, ...values: any[]): void => {
  /* eslint no-console: 0 */
  console[func](
    `%c  LINKED-LOVELACE-UI \n%c  ${msg}   `,
    'color: orange; font-weight: bold; background: black',
    '',
    ...values,
  );
};
