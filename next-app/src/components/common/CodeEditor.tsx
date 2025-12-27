'use client';

import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { basicSetup, EditorView } from 'codemirror';
import { keymap, placeholder } from '@codemirror/view';
import { Compartment, EditorState } from '@codemirror/state';
import { acceptCompletion } from '@codemirror/autocomplete';
import { indentWithTab } from '@codemirror/commands';
import { indentUnit, LanguageDescription } from '@codemirror/language';
import { languages } from '@codemirror/language-data';
import { oneDark } from '@codemirror/theme-one-dark';

interface CodeEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  lang?: string;
  boilerplate?: string;
}

export interface CodeEditorRef {
  focus: () => void;
  formatPythonCode: () => Promise<boolean>;
}

function findChanges(oldStr: string, newStr: string) {
  let start = 0;
  while (start < oldStr.length && start < newStr.length && oldStr[start] === newStr[start]) {
    start++;
  }
  if (oldStr === newStr) return [];
  let endOld = oldStr.length,
    endNew = newStr.length;
  while (endOld > start && endNew > start && oldStr[endOld - 1] === newStr[endNew - 1]) {
    endOld--;
    endNew--;
  }
  return [
    {
      from: start,
      to: endOld,
      insert: newStr.slice(start, endNew),
    },
  ];
}

export const CodeEditor = forwardRef<CodeEditorRef, CodeEditorProps>(
  ({ id = '', value, onChange, onSave, lang = '', boilerplate = '' }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<EditorView | null>(null);
    const valueRef = useRef(value || boilerplate);
    const editorTheme = useRef(new Compartment());
    const editorLanguage = useRef(new Compartment());
    const isDarkModeRef = useRef(false);

    const getLang = useCallback(async () => {
      const language = languages.find((l) => l.alias.includes(lang));
      return language?.load();
    }, [lang]);

    useImperativeHandle(ref, () => ({
      focus: () => {
        editorRef.current?.focus();
      },
      formatPythonCode: async () => {
        return false;
      },
    }));

    useEffect(() => {
      if (!containerRef.current) return;

      isDarkModeRef.current = document.documentElement.classList.contains('dark');

      const extensions = [
        basicSetup,
        keymap.of([{ key: 'Tab', run: acceptCompletion }, indentWithTab]),
        indentUnit.of('    '),
        placeholder('Enter your code here...'),
        EditorView.updateListener.of((e) => {
          if (e.docChanged) {
            valueRef.current = e.state.doc.toString();
            onChange(valueRef.current);
          }
        }),
        editorTheme.current.of([]),
        editorLanguage.current.of([]),
      ];

      const editor = new EditorView({
        state: EditorState.create({
          doc: valueRef.current,
          extensions,
        }),
        parent: containerRef.current,
      });

      editorRef.current = editor;

      if (isDarkModeRef.current) {
        editor.dispatch({
          effects: editorTheme.current.reconfigure(oneDark),
        });
      }

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const newIsDarkMode = document.documentElement.classList.contains('dark');
            if (newIsDarkMode !== isDarkModeRef.current) {
              isDarkModeRef.current = newIsDarkMode;
              if (newIsDarkMode) {
                editor.dispatch({
                  effects: editorTheme.current.reconfigure(oneDark),
                });
              } else {
                editor.dispatch({
                  effects: editorTheme.current.reconfigure([]),
                });
              }
            }
          }
        });
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });

      const keydownHandler = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault();
          onSave?.();
        }
      };

      document.addEventListener('keydown', keydownHandler);

      return () => {
        observer.disconnect();
        document.removeEventListener('keydown', keydownHandler);
        editor.destroy();
      };
    }, [onChange, onSave]);

    useEffect(() => {
      const setLanguage = async () => {
        const language = await getLang();
        if (language && editorRef.current) {
          editorRef.current.dispatch({
            effects: editorLanguage.current.reconfigure(language),
          });
        }
      };
      setLanguage();
    }, [lang, getLang]);

    useEffect(() => {
      if (editorRef.current && value !== valueRef.current) {
        const changes = findChanges(valueRef.current, value);
        valueRef.current = value;
        if (changes.length > 0) {
          editorRef.current.dispatch({ changes });
        }
      }
    }, [value]);

    return <div ref={containerRef} id={`code-textarea-${id}`} className="h-full w-full text-sm" />;
  }
);

CodeEditor.displayName = 'CodeEditor';
