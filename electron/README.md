# Десктопное приложение GOLOS Блоги

Работает на Windows и Linux.

```js
git clone https://github.com/golos-blockchain/ui-blogs
```

### Сборка приложения

Сборка должна осуществляться на каждой ОС в отдельности, то есть на Windows можно собрать GOLOS Блоги для Windows, а на Linux - для Linux.

1. Установите Node.js 16 ([Windows](https://nodejs.org/dist/v16.14.0/node-v16.14.0-x64.msi), [Linux](https://github.com/nodesource/distributions/blob/master/README.md)). В случае Windows тщательно проследите, нет ли в установщике флажка "Добавить Node.js в переменную PATH", и если он есть, то отметьте его.

2. Установите глобальные зависимости:
```sh
npx yarn global add electron@17.1.2 electron-builder@22.14.13
```

3. Скачайте репозиторий с помощью git clone (команда есть выше).

4. В любую папку скачайте репозиторий `ui-messenger` и выполните в нем:

```sh
npx yarn install
npx yarn run build:desktop
```

(настройка файлов конфигурации в ui-messenger не требуется)

5. Скопируйте папку `build` в папку `ui-blogs` и переименуйте в `msgs-build`.

6. Внесите все **настройки** в файле `config/desktop.json`:

- hide_comment_neg_rep
- site_domain (пример: golos.id то есть основной домен блогов)
- another_domains (альтернативные домены Блогов, чтобы можно было вставить ссылку с Блогов и она открылась в десктопном клиенте)
- ws_connection_app (список нод)
- images
- auth_service
- notify_service
- messenger_service (app://chat.golos.app - чтобы использовался встроенный мессенджер)
- elastic_search
- apidex_service
- hidden_assets
- app_updater
- forums
- gamefication

7. Установите все зависимости (для сборки).

```sh
npx yarn install
```

8. Соберите интерфейс клиента.

```sh
npx yarn run build:app
```

9. После сборки интерфейса можно запустить его в тестовом режиме, используя команду:

```sh
npx yarn run start:app
```

10. Или собрать дистрибутивы приложения:

```sh
npx yarn run pack:app
```

Собранные дистрибутивы будут лежать в папке `dist`.

Для Windows будет собран инсталлятор NSIS. Установка максимально проста. Пользователь запускает инсталлятор и он сразу устанавливает клиент и все его зависимости, создает все нужные ярлыки и запускает клиент.

В случае Linux будет собран пакет deb (установить можно также в 1 клик с помощью `dpkg -i glsblogs-1.0.0.deb`).

### Дополнительно

Существует также возможность быстрой пересборки интерфейса. Если вы внесли изменения только в файлы, находящиеся в папке `electron`, то вместо `yarn run build:app` используйте:

```sh
npx yarn run postbuild:app
```

И это значительно сэкономит время.
