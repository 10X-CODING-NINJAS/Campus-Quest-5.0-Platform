export interface LanguageConfig {
  image: string;
  filename: string;
  compileCmd: string[] | null;
  runCmd: string[];
  timeoutMs: number;
  memoryMb: number;
}

export const LANGUAGE_CONFIG: Record<SupportedLanguage, LanguageConfig> = {
  c: {
    image: process.env.DOCKER_IMAGE_C ?? 'campus-quest-judge-c:latest',
    filename: 'main.c',
    compileCmd: ['gcc', 'main.c', '-O2', '-std=c17', '-lm', '-o', 'main'],
    runCmd: ['./main'],
    timeoutMs: 2000,
    memoryMb: 256,
  },
  cpp: {
    image: process.env.DOCKER_IMAGE_CPP ?? 'campus-quest-judge-cpp:latest',
    filename: 'main.cpp',
    compileCmd: ['g++', 'main.cpp', '-O2', '-std=c++17', '-lm', '-o', 'main'],
    runCmd: ['./main'],
    timeoutMs: 2000,
    memoryMb: 256,
  },
  java: {
    image: process.env.DOCKER_IMAGE_JAVA ?? 'campus-quest-judge-java:latest',
    filename: 'Main.java',
    compileCmd: ['javac', 'Main.java'],
    runCmd: ['java', '-Xmx256m', '-Xss64m', '-XX:+UseSerialGC', 'Main'],
    timeoutMs: 5000,
    memoryMb: 512,
  },
  python: {
    image: process.env.DOCKER_IMAGE_PYTHON ?? 'campus-quest-judge-python:latest',
    filename: 'main.py',
    compileCmd: null,
    runCmd: ['python3', '-u', 'main.py'],
    timeoutMs: 5000,
    memoryMb: 256,
  },
};

export type SupportedLanguage = 'c' | 'cpp' | 'java' | 'python';

export function isSupportedLanguage(lang: string): lang is SupportedLanguage {
  return lang === 'c' || lang === 'cpp' || lang === 'java' || lang === 'python';
}
