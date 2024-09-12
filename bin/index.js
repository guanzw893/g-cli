#!/usr/bin/env node

import { Command } from 'commander'
import chalk from 'chalk'
import inquirer from 'inquirer'
import degit from 'degit'
import { existsSync } from 'fs'
import { resolve } from 'path'

const { red, green, blue } = chalk
const { prompt } = inquirer

const program = new Command()

const promptsConfig = {
  framework: {
    message: 'Select a framework to use:',
    choices: [
      { name: 'Vue', value: 'vue' },
      { name: 'Uniapp', value: 'uniapp' },
      { name: 'Electron', value: 'electron' }
    ],
    next: {
      vue: {
        message: 'Select a Vue framework:',
        choices: [{ name: 'Nuxt', value: 'nuxt' }],
        next: {
          nuxt: {
            message: 'Select a Nuxt version:',
            choices: [{ name: 'Nuxt v3', value: 'v3' }]
          }
        }
      },
      uniapp: {
        message: 'Select a Vue version:',
        choices: [{ name: '3.x', value: 'vue-v3' }]
      },
      electron: {
        message: 'Select a Electron framework:',
        choices: [{ name: 'Nuxt', value: 'nuxt' }],
        next: {
          nuxt: {
            message: 'Select a Nuxt version:',
            choices: [{ name: 'Nuxt v3', value: 'v3' }]
          }
        }
      }
    }
  }
}

const templateRepoMap = {
  'vue-nuxt-v3': 'https://github.com/guanzw893/nuxt-init.git',
  'uniapp-vue-v3': 'https://github.com/guanzw893/uniapp-vite-vue3-init.git',
  'electron-nuxt-v3': 'https://github.com/guanzw893/nuxt-electron-init.git'
}

// 递归处理函数，根据配置生成 `inquirer` 提示
async function promptUser(config, result = []) {
  const currentPrompt = await prompt([
    {
      type: 'list',
      name: 'selection',
      message: config.message,
      choices: config.choices
    }
  ])

  const selectedValue = currentPrompt.selection
  result.push(selectedValue)

  if (config.next && config.next[selectedValue]) {
    return await promptUser(config.next[selectedValue], result)
  }

  return result.join('-')
}

program
  .command('create <project-name>')
  .description('Create a new project from a template')
  .action(async (projectName) => {
    const targetDir = resolve(process.cwd(), projectName)

    if (existsSync(targetDir)) {
      console.error(red(`Error: Directory ${projectName} already exists.`))
      process.exit(1)
    }

    // 开始提示用户进行选择
    const finalSelection = await promptUser(promptsConfig.framework)

    // 根据用户的最终选择确定仓库地址
    const templateRepo = templateRepoMap[finalSelection]

    if (!templateRepo) {
      console.error(red('Error: Unable to determine the template repository.'))
      process.exit(1)
    }

    // 拉取模板
    console.log(
      green(
        `Creating a new project in ${targetDir} using the selected template...`
      )
    )

    const emitter = degit(templateRepo, { cache: false, force: true })

    emitter.on('info', (info) => {
      console.log(blue(info.message))
    })

    try {
      await emitter.clone(targetDir)
      console.log(
        green(`Project ${projectName} has been created successfully.`)
      )
    } catch (err) {
      console.error(red(`Failed to create project: ${err.message}`))
    }
  })

program.parse(process.argv)
