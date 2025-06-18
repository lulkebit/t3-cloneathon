// Using a global variable for the Pyodide instance
// This is a common pattern for managing a singleton instance like Pyodide
// that needs to be loaded asynchronously and then accessed globally.
declare global {
  interface Window {
    pyodideInstance: any;
    pyodideLoadingPromise: Promise<any> | null;
  }
}

let pyodideInstanceInternal: any = null;
let pyodideLoadingPromiseInternal: Promise<any> | null = null;

const outputMessages: string[] = [];
const errorMessages: string[] = [];
let onOutputCallback: ((msg: string) => void) | null = null;
let onErrorCallback: ((msg: string) => void) | null = null;

const pyodideService = {
  get isLoading(): boolean {
    return !!pyodideLoadingPromiseInternal && !pyodideInstanceInternal;
  },

  get instance(): any | null {
    return pyodideInstanceInternal;
  },

  async initPyodide(
    onOutput: (msg: string) => void,
    onError: (msg: string) => void
  ): Promise<void> {
    onOutputCallback = onOutput;
    onErrorCallback = onError;

    if (pyodideInstanceInternal) {
      // Already initialized, just ensure callbacks are set if they changed
      pyodideInstanceInternal.setStdout({ batched: onOutputCallback });
      pyodideInstanceInternal.setStderr({ batched: onErrorCallback });
      return;
    }

    if (pyodideLoadingPromiseInternal) {
      await pyodideLoadingPromiseInternal; // Wait for the existing loading process
      // Ensure callbacks are set after loading is complete
      if (pyodideInstanceInternal) {
        pyodideInstanceInternal.setStdout({ batched: onOutputCallback });
        pyodideInstanceInternal.setStderr({ batched: onErrorCallback });
      }
      return;
    }

    console.log('Initializing Pyodide...');
    pyodideLoadingPromiseInternal = (async () => {
      try {
        // @ts-ignore // Pyodide is loaded via script tag or dynamically, not as a typical ES module
        const { loadPyodide } = await import('pyodide/pyodide.js'); // Adjust path if needed based on actual pyodide structure

        // Check if window.loadPyodide is available (alternative loading method)
        // if (!loadPyodide && window.loadPyodide) {
        //   loadPyodide = window.loadPyodide;
        // }

        if (!loadPyodide) {
          throw new Error('loadPyodide function not found. Ensure Pyodide is correctly installed and imported.');
        }

        const instance = await loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/', // Using CDN
        });

        pyodideInstanceInternal = instance;
        window.pyodideInstance = instance; // Make it globally accessible for convenience if needed

        // Set up stdout and stderr
        // The 'batched' option collects multiple print statements from one execution
        // and calls the callback once per batch.
        instance.setStdout({ batched: (msg: string) => onOutputCallback?.(msg) });
        instance.setStderr({ batched: (msg: string) => onErrorCallback?.(msg) });

        console.log('Pyodide initialized successfully.');
      } catch (e) {
        console.error('Failed to initialize Pyodide:', e);
        onErrorCallback?.(`Failed to initialize Pyodide: ${e instanceof Error ? e.message : String(e)}`);
        pyodideLoadingPromiseInternal = null; // Reset promise on error
        throw e; // Re-throw to allow caller to handle
      } finally {
        // Don't set loadingPromise to null here if successful,
        // as it indicates loading has completed.
        // If it failed, it's reset above.
      }
    })();

    await pyodideLoadingPromiseInternal;
  },

  async runPython(code: string): Promise<any> {
    if (!pyodideInstanceInternal) {
      throw new Error('Pyodide is not initialized. Call initPyodide() first.');
    }
    if (this.isLoading) { // Check isLoading getter
      throw new Error('Pyodide is still loading.');
    }

    // Clear previous messages for this run
    outputMessages.length = 0;
    errorMessages.length = 0;

    console.log('Running Python code:\n', code);
    try {
      // Ensure stdout and stderr are set to capture output for this specific run
      // This might be redundant if callbacks are stable, but good for safety
      if (onOutputCallback) pyodideInstanceInternal.setStdout({ batched: onOutputCallback });
      if (onErrorCallback) pyodideInstanceInternal.setStderr({ batched: onErrorCallback });

      const result = await pyodideInstanceInternal.runPythonAsync(code);
      console.log('Python execution result:', result);
      return result;
    } catch (e) {
      console.error('Error running Python code:', e);
      // The error should also be captured by setStderr, but re-throw for direct handling
      throw e;
    }
  },

  getOutputMessages(): string[] {
    return [...outputMessages];
  },

  getErrorMessages(): string[] {
    return [...errorMessages];
  },
};

export default pyodideService;
