// SPDX-License-Identifier: Apache-2.0
/** Migration SQL files are inlined as strings by babel-plugin-inline-import. */
declare module '*.sql' {
  const content: string;
  export default content;
}
