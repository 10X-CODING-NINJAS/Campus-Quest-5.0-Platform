import './src/config/env.ts';
import { discoverProblems } from './src/judge/problem-loader.ts';

discoverProblems().then(problems => {
  console.log("Problems loaded:", problems.length);
  console.log(problems.map(p => p.id));
}).catch(console.error);
