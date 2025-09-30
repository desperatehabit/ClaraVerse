import React, { useState, useRef, useCallback } from 'react';
import { VoiceInputButton, VoiceInputButtonProps } from './VoiceInputButton';

export interface VoiceInputFieldProps extends VoiceInputButtonProps {
  /** Input field props */
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  /** Textarea props */
  textareaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
  /** Whether to use textarea instead of input */
  multiline?: boolean;
  /** Placeholder text for the input field */
  placeholder?: string;
  /** Initial value for the input field */
  value?: string;
  /** Callback when input value changes */
  onChange?: (value: string) => void;
  /** Whether to clear input after successful transcription */
  clearOnTranscription?: boolean;
  /** Whether to focus input after transcription */
  focusAfterTranscription?: boolean;
  /** Custom container styling */
  containerClassName?: string;
  /** Position of the voice button relative to input */
  buttonPosition?: 'left' | 'right' | 'overlay';
  /** Whether to show loading state during processing */
  showLoadingState?: boolean;
  /** Whether to show error states */
  showErrorStates?: boolean;
}

/**
 * Wrapper component that combines an input field with voice input functionality
 * Provides a consistent way to add voice input to any form field
 */
export const VoiceInputField: React.FC<VoiceInputFieldProps> = ({
  inputProps = {},
  textareaProps = {},
  multiline = false,
  placeholder = 'Type or use voice input...',
  value = '',
  onChange,
  onTranscription,
  clearOnTranscription = false,
  focusAfterTranscription = true,
  containerClassName = '',
  buttonPosition = 'right',
  showLoadingState = true,
  showErrorStates = true,
  onRecordingStart,
  onRecordingEnd,
  onError,
  disabled,
  size = 'md',
  tooltip = 'Voice input',
  showVisualFeedback = true,
  autoStop = true,
  maxDuration = 0,
  language = 'en',
  ...voiceButtonProps
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Handle input value changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
    setError(null); // Clear any previous errors
  }, [onChange]);

  // Handle voice transcription
  const handleTranscription = useCallback((transcribedText: string) => {
    const newValue = inputValue + (inputValue ? ' ' : '') + transcribedText;
    setInputValue(newValue);
    onChange?.(newValue);

    if (clearOnTranscription) {
      // Clear input after appending transcription
      setInputValue('');
      onChange?.('');
    }

    if (focusAfterTranscription && inputRef.current) {
      inputRef.current.focus();
    }

    setError(null);

    // Call external transcription handler if provided
    onTranscription?.(transcribedText);
  }, [inputValue, onChange, clearOnTranscription, focusAfterTranscription, onTranscription]);

  // Handle voice recording start
  const handleRecordingStart = useCallback(() => {
    setIsProcessing(true);
    setError(null);
    onRecordingStart?.();
  }, [onRecordingStart]);

  // Handle voice recording end
  const handleRecordingEnd = useCallback(() => {
    setIsProcessing(false);
    onRecordingEnd?.();
  }, [onRecordingEnd]);

  // Handle voice errors
  const handleError = useCallback((errorMessage: string) => {
    setIsProcessing(false);
    setError(errorMessage);
    if (showErrorStates) {
      onError?.(errorMessage);
    }
  }, [onError, showErrorStates]);

  // Get container classes based on button position
  const getContainerClasses = () => {
    const baseClasses = 'relative flex items-center gap-2';

    if (buttonPosition === 'overlay') {
      return `${baseClasses} ${containerClassName}`;
    }

    if (buttonPosition === 'left') {
      return `${baseClasses} flex-row-reverse ${containerClassName}`;
    }

    return `${baseClasses} ${containerClassName}`;
  };

  // Get input classes
  const getInputClasses = () => {
    const baseClasses = 'flex-1 min-w-0 border-0 outline-none focus:outline-none focus:ring-0 bg-transparent transition-colors';

    if (isProcessing && showLoadingState) {
      return `${baseClasses} opacity-75 cursor-not-allowed`;
    }

    return baseClasses;
  };

  // Create voice button with transcription handler
  const voiceButton = (
    <VoiceInputButton
      onTranscription={handleTranscription}
      onRecordingStart={handleRecordingStart}
      onRecordingEnd={handleRecordingEnd}
      onError={handleError}
      disabled={disabled || isProcessing}
      size={size}
      tooltip={tooltip}
      showVisualFeedback={showVisualFeedback}
      autoStop={autoStop}
      maxDuration={maxDuration}
      language={language}
      {...voiceButtonProps}
    />
  );

  // Render overlay button
  if (buttonPosition === 'overlay') {
    return (
      <div className={`relative ${containerClassName}`}>
        {multiline ? (
          <textarea
            {...textareaProps}
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled || isProcessing}
            className={`${getInputClasses()} ${textareaProps.className || ''}`}
          />
        ) : (
          <input
            {...inputProps}
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled || isProcessing}
            className={`${getInputClasses()} ${inputProps.className || ''}`}
          />
        )}

        {/* Overlay voice button */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          {voiceButton}
        </div>

        {/* Error message */}
        {showErrorStates && error && (
          <div className="absolute -bottom-5 left-0 text-xs text-red-500 dark:text-red-400">
            {error}
          </div>
        )}
      </div>
    );
  }

  // Render side-by-side layout
  return (
    <div className={getContainerClasses()}>
      {/* Voice button */}
      {buttonPosition === 'left' && voiceButton}

      {/* Input field */}
      {multiline ? (
        <textarea
          {...textareaProps}
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled || isProcessing}
          className={`${getInputClasses()} ${textareaProps.className || ''}`}
        />
      ) : (
        <input
          {...inputProps}
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled || isProcessing}
          className={`${getInputClasses()} ${inputProps.className || ''}`}
        />
      )}

      {/* Voice button */}
      {buttonPosition === 'right' && voiceButton}

      {/* Error message */}
      {showErrorStates && error && (
        <div className="text-xs text-red-500 dark:text-red-400 mt-1">
          {error}
        </div>
      )}
    </div>
  );
};

export default VoiceInputField;