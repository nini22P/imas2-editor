import { useEffect, useState } from 'react'

const DB_NAME = 'imas2-editor-db'
const STORE_NAME = 'handles'

const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

const idbGet = async <T>(key: string): Promise<T | null> => {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(key)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

const idbSet = async <T>(key: string, value: T | null) => {
  const db = await getDB()
  const transaction = db.transaction(STORE_NAME, 'readwrite')
  const store = transaction.objectStore(STORE_NAME)

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

const useLocalStorage = <T>(
  key: string,
  value: T | null,
  setValue: React.Dispatch<React.SetStateAction<T | null>>,
  options: { useIndexedDB?: boolean, onRestore?: (data: T | null) => void } = {}
) => {
  const [init, setInit] = useState(false)
  const { useIndexedDB, onRestore } = options

  useEffect(() => {
    if (!init) return

    if (useIndexedDB) {
      idbSet(key, value).catch(console.error)
    } else {
      try {
        const data = JSON.stringify(value)
        localStorage.setItem(key, data)
      } catch (err) {
        console.error('localStorage save error:', err)
      }
    }
  }, [value, init, key, useIndexedDB])

  useEffect(() => {
    const restoreValue = async () => {
      let data: T | null = null
      try {
        if (useIndexedDB) {
          data = await idbGet<T>(key)
        } else {
          const item = localStorage.getItem(key)
          data = item ? JSON.parse(item) as T : null
        }
      } catch (err) {
        console.error('restore error', err)
      }

      setValue(data)
      if (onRestore) onRestore(data)
      setInit(true)
    }

    restoreValue()
  }, [key, setValue, useIndexedDB])
}

export default useLocalStorage