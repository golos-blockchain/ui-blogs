# [golos.id](https://golos.id) and [golos.in](https://golos.in)

React.js web interface to the blockchain-based social media platform. It uses [Golos blockchain](https://github.com/golos-blockchain/chain-node), a fork of Steem blockchain powered by Graphene 2.0 technology to store JSON-based content for a plethora of web applications. 

## Why would I want to use?
* Learning how to build blockchain-based applications using GOLOS as a content storage
* Reviewing the inner workings of the social media platform
* Assisting with software development for GOLOS blockchain

## Installation

We recommend using docker to run in production. This is how we run the live site and it is the most supported method of both building and running application. We will always have the latest version available on [Docker Hub](https://hub.docker.com/r/golosblockchain/web-ui/tags).

#### Clone the repository
```bash
git clone https://github.com/golos-blockchain/ui-blogs &&
cd ui-blogs
```

Run all services (production mode):
```
sudo docker-compose up
```

#### Install for Development mode

```bash
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -

sudo apt-get install -y nodejs

npm install -g yarn

yarn install

yarn start
```

You now have your development front end running at localhost:8080, connected to the public GOLOS blockchain.

### Production
Generate a new crypto_key and save under server_session_secret in /config/default.json.

```bash
node
> crypto.randomBytes(32).toString('base64')
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