import { useEffect, useState } from "react";

const useLocalStorage = <T>(
  key: string,
  value: T | null,
  setValue: React.Dispatch<React.SetStateAction<T | null>>
) => {
  const [init, setInit] = useState(false);

  useEffect(
    () => {
      if (!init) return;
      const data = JSON.stringify(value);
      console.log('save');
      localStorage.setItem(key, data);
    },
    [value, init, key]
  )

  useEffect(
    () => {
      const item = localStorage.getItem(key);
      console.log('restore');
      setValue(item ? JSON.parse(item) : null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInit(true);
    },
    [key, setValue]
  )
}

export default useLocalStorage;