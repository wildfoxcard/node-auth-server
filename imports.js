#!/usr/bin/env node
const fs = require('fs')
const yaml = require('js-yaml')

const { User } = require('./models/User')
const { Permission } = require('./models/Permission')
const { Role } = require('./models/Role')
const { Settings } = require('./models/Settings')

const main = async () => {
  console.log('importing...')

  const yargs = require('yargs/yargs')
  const { hideBin } = require('yargs/helpers')
  const argv = yargs(hideBin(process.argv)).argv

  if (!argv.filename) {
    console.log('Please provide a filename using flag "--filename"')
    return;
  }

  let fileContents = fs.readFileSync(argv.filename, 'utf8');
  let data = yaml.safeLoad(fileContents);


  if (data.permissions) {
    for (var i = 0; i < data.permissions.length; i++) {
      const permission = data.permissions[i];

      //find and update permission push if permission doesn't exist
      await Permission.findOneAndUpdate({ name: permission },
        { name: permission },
        { new: true, upsert: true, setDefaultsOnInsert: true })

    }
  }

  if (data.roles) {
    for (var i = 0; i < data.roles.length; i++) {
      const role = data.roles[i];

      //find and update permission push if permission doesn't exist
      await Role.findOneAndUpdate({ name: role },
        { name: role },
        { new: true, upsert: true, setDefaultsOnInsert: true })
    }
  }

  const processUser = (users, type) => {
    for (var i = 0; i < users.length; i++) {
      const user = users[i];
      if (!user.email) {
        console.log("A test user was missed because no email was present.")
        continue;
      }

      if (await User.count({ email: user.email }) === 0) {
        const newUser = new User(Object.assign(user, { type }))

        await newUser.save()
      }

      if (user.permissions) {
        for (var x = 0; x < user.permissions.length; x++) {
          const permission = user.permissions[x];

          //find and update permission push if permission doesn't exist
          await Permission.findOneAndUpdate({ name: permission },
            { name: permission },
            { new: true, upsert: true, setDefaultsOnInsert: true })
        }
      }

      if (user.roles) {
        for (var x = 0; x < user.roles.length; x++) {

          const role = user.roles[x];

          //find and update permission push if permission doesn't exist
          await Role.findOneAndUpdate({ name: role },
            { name: role },
            { new: true, upsert: true, setDefaultsOnInsert: true })
        }
      }
    }
  }

  if (data.testUsers) {
    processUser(data.testUsers)
  }

  if (data.applicationUsers) {
    processUser(data.applicationUsers)
  }

  if (data.settings) {
    await Settings.findOneAndUpdate({},
      data.settings,
      { new: true, upsert: true, setDefaultsOnInsert: true })
  }

  console.log('Import successful with exit code 0')
}


main()