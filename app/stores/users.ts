import { useLocalStorage } from '@vueuse/core'
import { defineStore, skipHydrate } from 'pinia'

type User = {
    name: string
    userId: string
}

export const useUserStore = defineStore('user', () => {
    const user = skipHydrate(useLocalStorage<User>('user', {
        name: '',
        userId: '',
    }))

    function setUser(newName: string, newId: string) {
        user.value.name = newName
        user.value.userId = newId
    }

    function clearUser() {
        user.value.name = ''
        user.value.userId = ''
    }

    return {
        user,
        setUser,
        clearUser,
    }
})
