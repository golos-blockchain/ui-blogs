# [GOLOS.id](https://golos.id)

React.js web interface to the blockchain-based social media platform. It uses [Golos blockchain](https://github.com/golos-blockchain/golos), a fork of Steem blockchain powered by Graphene 2.0 technology to store JSON-based content for a plethora of web applications.   
## Why would I want to use GOLOS.id?
* Learning how to build blockchain-based applications using GOLOS as a content storage
* Reviewing the inner workings of the GOLOS.id social media platform
* Assisting with software development for GOLOS blockchain

## Installation

We recommend using docker to run in production. This is how we run the live site and it is the most supported method of both building and running application. We will always have the latest version available on [Docker Hub](https://hub.docker.com/r/golosblockchain/web-ui/tags).

#### Clone the repository and make a tmp folder
```bash
git clone https://github.com/golos-blockchain/golos-ui
cd golos-ui
mkdir tmp
```

Run all services (production mode):
```
sudo docker-compose up
```

#### Install for Development mode

```bash
# Install Node ver. 16 if you don't already have it.
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

npm install -g yarn

yarn install

yarn start
```

You now have your development front end running at localhost:8080, connected to the main public golos blockchain. You don't need to run ```golos``` locally, by default you will connect to ```https://api-full.golos.id```.  Use your regular account name and credentials to login -- there is no separate dev login.

#### Install mysql server

```bash
sudo apt-get update
sudo apt-get install mysql-server
```

On Ubuntu 16.04+ you may be unable to connect to mysql without root access, if
so update the mysql root user as follows::

```bash
mysql -u root -pgolosdev -e "GRANT ALL PRIVILEGES ON *.* TO 'golosdev'@'%'; FLUSH PRIVILEGES;"
```

Now launch mysql client and create golos_dev database:
```bash
mysql -u root
> CREATE DATABASE golos_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Install `sequelize-cli` globally:

```bash
yarn global add sequelize sequelize-cli mysql2
```

Run `sequelize db:migrate` in `db/` directory.

### Production
Generate a new crypto_key and save under server_session_secret in /config/default.json.

```bash
node
> crypto.randomBytes(32).toString('base64')
```

If you want to test it locally in production mode, just run the following commands:

```bash
yarn production
```

### Style Guides

##### File naming and location
- Prefer CamelCase js and jsx file names
- Prefer lower case one word directory names
- Keep stylesheet files close to components
- Component's stylesheet file name should match component name

##### Js & Jsx
We are using _Airbnb JavaScript Style Guide_ with some modifications (see .eslintrc).
Please run _eslint_ in the working directory before committing your changes and make sure you didn't introduce any new styling issues.

##### CSS & SCSS
If component requires a css rule, please use its uppercase name for the class, e.g. "Header" class for the header's root div.
We adhere to BEM methodology with exception for Foundation classes, here is an example for the Header component:

```html
<!-- Block -->
<ul class="Header">
  ...
  <!-- Element -->
  <li class="Header__menu-item">Menu Item 1</li>
  <!-- Element with modifier -->
  <li class="Header__menu-item--selected">Element with modifier</li>
</ul>
```
