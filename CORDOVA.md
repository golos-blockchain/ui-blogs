# Мобильное приложение GOLOS Блоги

Работает на Android.

```js
git clone https://github.com/golos-blockchain/ui-blogs
```

### Подготовка к сборке приложения

Для сборки требуется **Linux** (например, Ubuntu 18 - 20).

Кроме того, **для работы Android Studio** нужно установить окружение рабочего стола. Инструкция, как это сделать на VPS:

1. Выполните команды:
```sh
sudo apt-get update
sudo apt-get install lxde tightvncserver
```
(все настройки по умолчанию (нажимать Enter))

2. Запустите VNC server:
```sh
vncserver :1
```
и придумайте пароль. View-only - выберете n.

3. Для работы с удаленным рабочим столом установите на свой ПК (не на VPS) приложение VNC Viewer. Запустите его и подключитесь к IP-адресу VPS, используя порт 5901 и придуманный пароль.

4. Дальнейшие инструкции по сборке выполняйте из сессии этого рабочего стола, так как требуется графический интерфейс.

### Сборка приложения

1. Если у вас Linux современных версий (например **Ubuntu 20** или выше) - установите **Node.js 18** ([Windows](https://nodejs.org/dist/v18.20.5/node-v18.20.5-x64.msi), [Linux](https://github.com/nodesource/distributions/blob/master/README.md)).  
   Если у вас **Ubuntu 18** или иной старый Linux - установите **[Node.js 16](https://github.com/nodesource/distributions/blob/master/OLD_README.md#using-ubuntu-3)**.  

2. Установите Android Studio. 

3. Запустите Android Studio. Установите все, что будет предложено при установке.

4. Создайте пустое приложение Android (с любым Activity и конфигурацией), соберите его. Это нужно для проверки правильности установки Android Studio.

5. Запустите терминал.

6. Установите глобальные зависимости:
```sh
npx yarn global add cordova@11.0.0
```

7. Скачайте репозиторий с помощью git clone (команда есть выше), и зайдите в его папку с помощью:
```sh
cd ui-blogs
```

8. Внесите все **настройки** в файле `config/mobile.json`:

- site_domain (пример: golos.id то есть основной домен Блогов)
- images
- auth_service
- notify_service
- wallet_service
- messenger_service
- app_updater

9. Установите все зависимости (для сборки).

```sh
npx yarn install
```

10. Выполните команду (/root/ - это должен быть ваш путь к папке профиля, в ней лежит папка Android):
```sh
export ANDROID_SDK_ROOT=/root/Android/Sdk
```

11. Установка совместимой системы сборки.

Установите JDK (отдельно от Android Studio):
```sh
sudo apt-get install openjdk-8-jdk
```
После этого команда `javac -version` должна выдавать ответ вида: javac 1.8.x

Установите Gradle (отдельно от Android Studio):
```sh
sudo apt-get install gradle
```

Добавьте /root/Android/Sdk/platform-tools в переменную PATH (для adb, вспомогательное, для сборки не обязательно)

12. Откройте Android Studio, а из нее откройте SDK Manager (кнопка "☰" -> Tools -> SDK Manager). Установите Android build tools 30.0.3.
    Для этого слева выбираете **Languages & Frameworks -> Android SDK**, во вкладках сверху выбираете **SDK Tools**, включаете **Show package details**, отключаете **Hide obsolete packages**, после чего выбираете нужную версию Build tools и нажимаете Apply для установки.

13. Если собираетесь автоматически устанавливать и запускать приложение (а не вручную, перекинув apk на устройство), то сделайте следующее. Подключите устройство по USB (разрешив отладку) и убедитесь, что adb видит его, выполнив в командной строке команду
```sh
adb devices
```

14. Соберите приложение.

```sh
npx yarn run build:mobile
```
Сборка происходит в два этапа - сначала собирается код React с помощью Webpack, затем на его основе собирается мобильное приложение с помощью Cordova.  

Этап Cordova может выдавать ошибки, которые нужно устранить дополнительно.

В случае ошибки с требованием установить Build Tools нужной версии или иные компоненты, необходимо поступить как описано в пункте 12, выбрав нужную версию нужного компонента и установив. Затем снова попробовать собрать (используя при этом команду `npx yarn run postbuild:mobile`, чтобы не повторять этап Webpack, который уже выполнен).

В случае успешной сборки собранный APK будет в `cordova/platforms/android/app/build/outputs/apk/debug`
Кроме того, APK сразу же устанавливается на устройство. Об успешной установке свидетельствует сообщение `INSTALL SUCCESS`. Ошибка типа `"sh" ?? ?????` говорит о том, что устройство не обнаружено (например, проблемы с разъемом, кабелем).
