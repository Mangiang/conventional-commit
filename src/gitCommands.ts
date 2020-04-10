import exec from './execution'

export const addFiles = (path: string) => {
    return exec(`git add ${path}`)
}

export const commit = (name: string) => {
    return exec(`git commit -m ${name}`)
}

export const getCurrentBranch = () => {
    const match: RegExpMatchArray | null = exec(`git branch`).match(/^\s*\*\s*(.+)\s*$/)

    if (!match) {
        return null
    }
    
    return match[1]
}

export const push = (remote: string, branch: string) => {
    return exec(`git push ${remote} ${branch}`)
}