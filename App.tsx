
import React, { useState, useMemo, useCallback } from 'react';
import { generatePromptFromImage } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import { UploadIcon, SparklesIcon, CopyIcon, SpinnerIcon } from './components/Icons';

type AppStatus = 'idle' | 'uploading' | 'previewing' | 'generating' | 'success' | 'error';

export default function App() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [status, setStatus] = useState<AppStatus>('idle');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const imageUrl = useMemo(() => {
    if (imageFile) {
      return URL.createObjectURL(imageFile);
    }
    return null;
  }, [imageFile]);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      setStatus('error');
      setImageFile(null);
      return;
    }
    setImageFile(file);
    setGeneratedPrompt('');
    setError('');
    setStatus('previewing');
  }, []);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleGeneratePrompt = useCallback(async () => {
    if (!imageFile) {
      setError('Please select an image first.');
      setStatus('error');
      return;
    }

    setStatus('generating');
    setError('');
    setGeneratedPrompt('');

    try {
      const base64Image = await fileToBase64(imageFile);
      const mimeType = imageFile.type;
      const prompt = await generatePromptFromImage(base64Image, mimeType);
      setGeneratedPrompt(prompt);
      setStatus('success');
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate prompt: ${errorMessage}`);
      setStatus('error');
    }
  }, [imageFile]);

  const handleCopyPrompt = () => {
    if (generatedPrompt) {
      navigator.clipboard.writeText(generatedPrompt);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setGeneratedPrompt('');
    setError('');
    setStatus('idle');
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
  };
  
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
        setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
        processFile(file);
    }
  }, [processFile]);


  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-3xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            Image to Prompt
          </h1>
          <p className="mt-2 text-lg text-slate-400">
            Let AI craft the perfect prompt for your image.
          </p>
        </header>

        <main className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-8 transition-all duration-300">
          {!imageFile && (
            <div 
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 transition-colors duration-300 ${isDragging ? 'border-purple-500 bg-slate-800' : 'border-slate-600 hover:border-purple-500'}`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              aria-label="Image upload zone"
            >
              <label htmlFor="image-upload" className="cursor-pointer text-center">
                <UploadIcon className="mx-auto h-12 w-12 text-slate-500" />
                {isDragging ? (
                  <>
                    <h2 className="mt-4 text-xl font-semibold text-purple-300">Drop to Upload</h2>
                    <p className="mt-1 text-sm text-slate-400">Release the image to begin</p>
                  </>
                ) : (
                  <>
                    <h2 className="mt-4 text-xl font-semibold text-slate-300">Upload an Image</h2>
                    <p className="mt-1 text-sm text-slate-400">Drag & drop or click to select a file</p>
                  </>
                )}
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                  disabled={status === 'generating'}
                />
              </label>
            </div>
          )}

          {imageUrl && (
            <div className="relative group w-full aspect-video rounded-lg overflow-hidden border border-slate-700">
              <img src={imageUrl} alt="Uploaded preview" className="w-full h-full object-contain" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                <button
                  onClick={handleReset}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Remove Image
                </button>
              </div>
            </div>
          )}

          {status === 'previewing' && (
            <div className="mt-6 text-center">
              <button
                onClick={handleGeneratePrompt}
                disabled={status === 'generating'}
                className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SparklesIcon className="w-5 h-5 mr-2" />
                Generate Prompt
              </button>
            </div>
          )}
          
          {status === 'generating' && (
            <div className="mt-6 text-center flex flex-col items-center justify-center text-slate-400">
               <SpinnerIcon className="w-8 h-8 text-purple-400 animate-spin" />
               <p className="mt-4 text-lg">Generating creative prompt...</p>
               <p className="text-sm">This may take a moment.</p>
            </div>
          )}

          {error && status === 'error' && (
            <div className="mt-6 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg text-center">
              <p>{error}</p>
            </div>
          )}

          {generatedPrompt && status === 'success' && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-slate-300 mb-2">Generated Prompt:</h3>
              <div className="relative p-4 bg-slate-900/70 border border-slate-700 rounded-lg">
                <p className="text-slate-300 leading-relaxed">{generatedPrompt}</p>
                <button
                  onClick={handleCopyPrompt}
                  className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-600 rounded-md transition-colors"
                  aria-label="Copy prompt"
                >
                  <CopyIcon className="w-5 h-5" />
                </button>
                {copySuccess && (
                  <div className="absolute top-3 right-12 px-2 py-1 text-xs bg-green-500 text-white rounded-md">
                    Copied!
                  </div>
                )}
              </div>
              <div className="mt-4 text-center">
                  <button
                    onClick={handleGeneratePrompt}
                    disabled={status === 'generating'}
                    className="inline-flex items-center justify-center px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg shadow-sm transition-colors duration-300 disabled:opacity-50"
                  >
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    Regenerate
                  </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
