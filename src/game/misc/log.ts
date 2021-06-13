const createLogger = (tag: string) => (...what: any) => console.log('[' + tag + ']:', ...what)
export default createLogger
