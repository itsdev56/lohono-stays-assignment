#lohono stays 

The project is generated by Express and NodeJS


This is the readme file for macOS. For Ubuntu or Linux Mint, you can refer to [Ubuntu readme](UBUNTU_README.md).
### Install necessary packages

```
brew install git
brew install wget
```

If Node version 8.9.0 or higher is installed then skip this process
### Install NVM and node version 14.15.5
```
touch ~/.bash_profile
wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.32.1/install.sh | bash
source ~/.bash_profile
nvm install 14.15.5
nvm use 14.15.5
nvm alias default 14.15.5
```

If mysql database is created then skip this process
### Install local dependencies from project directory
```npm install``` or ```yarn install```

If mysql database is created then skip this process
### Creating a local mysql database
Install mysql server community edition (version 5.7.16 or higher) locally. **Do not enable validate password plugin. Enter password as ```root``` when prompted. Skip all other options.**
```
brew install mysql@5.7
echo 'export PATH="/usr/local/opt/mysql@5.7/bin:$PATH"' >> ~/.bash_profile
source ~/.bash_profile
brew services start mysql@5.7
mysql_secure_installation
```

### Starting server on your machine
You can access the application at `localhost:3000`

- Starting Node server in the root directory
```nodemon .``` or `forever -w .`
Now you can access the application at `localhost:3000`
