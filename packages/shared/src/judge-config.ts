export const LANGUAGE_CONFIG = {
  c: {
    image: 'judge-gcc:latest',
    compileCmd: 'gcc -O2 -o /box/out /box/main.c',
    runCmd: '/box/out',
    ext: 'c',
    timeoutMs: 2000,
    memoryMb: 256,
  },
  cpp: {
    image: 'judge-gcc:latest',
    compileCmd: 'g++ -O2 -std=c++17 -o /box/out /box/main.cpp',
    runCmd: '/box/out',
    ext: 'cpp',
    timeoutMs: 2000,
    memoryMb: 256,
  },
  python: {
    image: 'judge-python:latest',
    compileCmd: null, // interpreted
    runCmd: 'python3 /box/main.py',
    ext: 'py',
    timeoutMs: 5000, // give python more time
    memoryMb: 256,
  },
  java: {
    image: 'judge-java:latest',
    compileCmd: 'javac -d /box /box/Main.java',
    runCmd: 'java -cp /box Main',
    ext: 'java',
    timeoutMs: 4000,
    memoryMb: 512, // JVM overhead
  },
} as const;

export type SupportedLanguage = keyof typeof LANGUAGE_CONFIG;
