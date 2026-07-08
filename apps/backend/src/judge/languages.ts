export const LANGUAGE_CONFIG = {
  c: {
    image: 'judge-c:latest',
    filename: 'main.c',
    compileCmd: ['gcc', '-O2', '-o', 'out', 'main.c'],
    runCmd: ['./out'],
    timeoutMs: 2000,
    memoryMb: 256,
  },
  cpp: {
    image: 'judge-cpp:latest',
    filename: 'main.cpp',
    compileCmd: ['g++', '-O2', '-std=c++17', '-o', 'out', 'main.cpp'],
    runCmd: ['./out'],
    timeoutMs: 2000,
    memoryMb: 256,
  },
  python: {
    image: 'judge-python:latest',
    filename: 'main.py',
    compileCmd: null,
    runCmd: ['python3', 'main.py'],
    timeoutMs: 5000,
    memoryMb: 256,
  },
  java: {
    image: 'judge-java:latest',
    filename: 'Main.java',
    compileCmd: ['javac', 'Main.java'],
    runCmd: ['java', '-Xmx256m', 'Main'],
    timeoutMs: 4000,
    memoryMb: 512,
  },
} as const;

export type SupportedLanguage = keyof typeof LANGUAGE_CONFIG;
