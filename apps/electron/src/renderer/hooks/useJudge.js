import { useState, useEffect } from 'react';
// We need a dummy socket implementation for now if real one is not available
// Or we import it from lib/socket if it exists. We'll try to import or mock it.
// Assuming we don't have socket.io-client set up yet in the renderer, I will create a basic mock or import it.
// The user's code imports from '../lib/socket'. I'll write the hook exactly as requested.
// Note: If '../lib/socket' does not exist, this will fail to compile.
// I will create a dummy socket file just in case to prevent breaking the build.
import { socket } from '../lib/socket';
export function useJudge(problemId) {
    const [isRunning, setIsRunning] = useState(false);
    const [runResult, setRunResult] = useState(null);
    const runCode = (code, language, stdin) => {
        setIsRunning(true);
        socket.emit('run:code', { problemId, code, language, stdin });
    };
    const submitCode = (code, language) => {
        setIsRunning(true);
        socket.emit('submit:code', { problemId, code, language });
    };
    useEffect(() => {
        const onRunResult = (result) => {
            setRunResult(result);
            setIsRunning(false);
        };
        const onSubmitResult = (_result) => {
            setIsRunning(false);
            // navigate to verdict view, update leaderboard state, etc.
        };
        socket.on('run:result', onRunResult);
        socket.on('submit:result', onSubmitResult);
        return () => {
            socket.off('run:result', onRunResult);
            socket.off('submit:result', onSubmitResult);
        };
    }, []);
    return { runCode, submitCode, isRunning, runResult };
}
//# sourceMappingURL=useJudge.js.map