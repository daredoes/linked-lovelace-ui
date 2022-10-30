export const log = (msg, ...values) => {
    /* eslint no-console: 0 */
    console.info(
        `%c  LINKED-LOVELACE-CARD \n%c  ${msg}   `,
        'color: orange; font-weight: bold; background: black',
        'font-weight: bold;',
        ...values
    );
}