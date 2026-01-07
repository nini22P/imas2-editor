import { useEffect, useState, useRef } from 'react'

const DEFAULT_DB_NAME = 'db'
const DEFAULT_STORE_NAME = 'store'

const getDB = (dbName: string, storeName: string): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1)
        request.onupgradeneeded = () => {
            const db = request.result
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName)
            }
        }
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

const idbGet = async <T>(key: string, dbName: string, storeName: string): Promise<T | null> => {
    const db = await getDB(dbName, storeName)
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly')
        const store = transaction.objectStore(storeName)
        const request = store.get(key)
        request.onsuccess = () => resolve(request.result || null)
        request.onerror = () => reject(request.error)
    })
}

const idbSet = async <T>(key: string, value: T | null, dbName: string, storeName: string) => {
    const db = await getDB(dbName, storeName)
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)

    if (value === null || value === undefined) {
        store.delete(key)
    } else {
        store.put(value, key)
    }

    return new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
    })
}

interface Options<T> {
    useIndexedDB?: boolean
    dbName?: string
    storeName?: string
    onRestore?: (data: T) => void
}

export function useLocalState<T>(
    key: string,
    initialValue: T,
    options: Options<T> = {}
): [T, React.Dispatch<React.SetStateAction<T>>] {
    const {
        useIndexedDB,
        dbName = DEFAULT_DB_NAME,
        storeName = DEFAULT_STORE_NAME,
        onRestore,
    } = options

    const [state, setState] = useState<T>(() => {
        if (useIndexedDB) return initialValue

        try {
            const item = localStorage.getItem(key)
            return item ? (JSON.parse(item) as T) : initialValue
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error)
            return initialValue
        }
    })

    const [isRestored, setIsRestored] = useState(false)
    const isFirstRender = useRef(true)
    const onRestoreRef = useRef(onRestore)
    const initialValueRef = useRef(initialValue)

    useEffect(() => {
        onRestoreRef.current = onRestore
        initialValueRef.current = initialValue
    }, [onRestore, initialValue])

    useEffect(() => {
        const restore = async () => {
            try {
                let restoredValue: T | null = null
                if (useIndexedDB) {
                    restoredValue = await idbGet<T>(key, dbName, storeName)
                } else {
                    const item = localStorage.getItem(key)
                    restoredValue = item ? (JSON.parse(item) as T) : null
                }

                if (restoredValue !== null) {
                    setState(restoredValue)
                    if (onRestoreRef.current) onRestoreRef.current(restoredValue)
                } else {
                    if (onRestoreRef.current) onRestoreRef.current(initialValueRef.current)
                }
            } catch (error) {
                console.error(`Error restoring key "${key}":`, error)
            } finally {
                setIsRestored(true)
            }
        }

        restore()
    }, [key, useIndexedDB, dbName, storeName])

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }

        if (!isRestored) return

        if (useIndexedDB) {
            idbSet(key, state, dbName, storeName).catch(err => console.error(`Error saving IndexedDB key "${key}":`, err))
        } else {
            try {
                localStorage.setItem(key, JSON.stringify(state))
            } catch (err) {
                console.error(`Error saving localStorage key "${key}":`, err)
            }
        }
    }, [key, state, useIndexedDB, isRestored, dbName, storeName])

    return [state, setState]
}

export default useLocalState
