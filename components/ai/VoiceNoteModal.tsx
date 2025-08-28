interface SpeechRecognitionEvent extends Event { readonly resultIndex: number; readonly results: SpeechRecognitionResultList; }
interface SpeechRecognitionResultList { readonly length: number; item(index: number): SpeechRecognitionResult; [index: number]: SpeechRecognitionResult; }
interface SpeechRecognitionResult { readonly isFinal: boolean; readonly length: number; item(index: number): SpeechRecognitionAlternative; [index: number]: SpeechRecognitionAlternative; }
interface SpeechRecognitionAlternative { readonly transcript: string; readonly confidence: number; }
interface SpeechRecognitionErrorEvent extends Event { readonly error: string; readonly message: string; }
interface SpeechRecognition extends EventTarget { lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number; start(): void; stop(): void; abort(): void; onend: ((this: SpeechRecognition, ev: Event) => any) | null; onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null; onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null; onstart: ((this: SpeechRecognition, ev: Event) => any) | null; }
declare var SpeechRecognition: { prototype: SpeechRecognition; new(): SpeechRecognition; };
declare var webkitSpeechRecognition: { prototype: SpeechRecognition; new(): SpeechRecognition; };
declare global { interface Window { SpeechRecognition: typeof SpeechRecognition; webkitSpeechRecognition: typeof webkitSpeechRecognition; } }

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useLanguage } from '../../contexts/LanguageContext';
import { summarizeText } from '../../services/aiService';

interface VoiceNoteModalProps { isOpen: boolean; onClose: () => void; onInsert: (text: string) => void; }

const VoiceNoteModal = ({ isOpen, onClose, onInsert }: VoiceNoteModalProps) => {
    const { t } = useLanguage();
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [finalTranscript, setFinalTranscript] = useState('');
    const [summary, setSummary] = useState('');
    const [error, setError] = useState('');
    const [isSummarizing, setIsSummarizing] = useState(false);
    
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    const handleStartRecording = useCallback(() => {
        if (recognitionRef.current) {
            setTranscript(''); setFinalTranscript(''); setSummary(''); setError('');
            recognitionRef.current.start();
        }
    }, []);

    const handleStopRecording = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, []);

    const handleGenerateSummary = async () => {
        if (!finalTranscript) return;
        setIsSummarizing(true);
        try {
            const result = await summarizeText(finalTranscript);
            if(result.success) setSummary(result.text);
            else setError(result.text);
        } catch(e) { setError(t('aiError')); } 
        finally { setIsSummarizing(false); }
    };
    
    useEffect(() => {
        if (!isOpen) return;
        const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionImpl) { setError(t('voiceNoteBrowserNotSupported')); return; }
        
        const recognition = new SpeechRecognitionImpl();
        recognition.continuous = true; recognition.interimResults = true; recognition.lang = 'tr-TR';
        
        recognition.onstart = () => setIsRecording(true);
        recognition.onend = () => setIsRecording(false);
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            setError(event.error === 'not-allowed' ? t('voiceNotePermissionError') : event.error);
            setIsRecording(false);
        };
        
        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let interim = '', final = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                event.results[i].isFinal ? final += event.results[i][0].transcript : interim += event.results[i][0].transcript;
            }
            setTranscript(interim);
            if (final) setFinalTranscript(prev => prev ? `${prev}\n${final}` : final);
        };

        recognitionRef.current = recognition;
        return () => { recognitionRef.current?.stop(); };
    }, [isOpen, t]);

    return (
        <Modal
            isOpen={isOpen} onClose={onClose} title={t('voiceNoteModalTitle')} size="2xl"
            footer={<><Button variant="secondary" onClick={onClose}>{t('cancel')}</Button><Button variant="primary" onClick={() => onInsert(summary || finalTranscript)} disabled={!finalTranscript}>{t('voiceNoteInsertText')}</Button></>}
        >
            <div className="flex flex-col items-center">
                <Button onClick={isRecording ? handleStopRecording : handleStartRecording} icon={isRecording ? 'fas fa-stop' : 'fas fa-microphone'} variant={isRecording ? 'danger' : 'success'} className="w-24 h-24 rounded-full text-3xl mb-4" />
                <p className="text-sm text-cnk-txt-muted h-5">{isRecording ? t('voiceNoteListening') : (error || "Kayda başla.")}</p>
                <div className="w-full mt-4 p-3 bg-cnk-bg-light border rounded-md min-h-[150px] max-h-60 overflow-y-auto">
                    <p className="whitespace-pre-wrap">{finalTranscript}<span className="text-cnk-txt-muted-light">{transcript}</span></p>
                </div>
                <div className="w-full mt-4">
                    <Button onClick={handleGenerateSummary} isLoading={isSummarizing} disabled={!finalTranscript || isRecording} icon="fas fa-robot">{t('summarizeNotes')}</Button>
                    {summary && (
                         <div className="w-full mt-2 p-3 bg-cnk-bg-light border border-cnk-accent-primary rounded-md">
                            <h4 className="font-semibold text-cnk-accent-primary">{t('aiSummary')}:</h4>
                            <p className="text-sm whitespace-pre-wrap">{summary}</p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default VoiceNoteModal;