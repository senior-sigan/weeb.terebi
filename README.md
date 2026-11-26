# Weeb Terebi

Просмотр аниме с сайта Anime365 на Samsung Tizen 5.5. 

## Development

Поместите `ACCESS_TOKEN=...` в файл `.env` в корне проекта. При сборке токен попадёт в локальный виджет.

Для главной страницы добавьте `SHIKIMORI_USER_ID=...` в тот же файл. Укажите числовой ID профиля Shikimori с доступным списком «Смотрю». ID можно найти в поле `id` по адресу `https://shikimori.io/api/users/ИМЯ_ПРОФИЛЯ`.

```sh
mise install
mise run app:install
mise run electron:install
mise run electron
```

Команда `mise run tv:install` собирает виджет и запускает его на телевизоре по адресу из `app/package.json`. Отдельная сборка — `mise run build`, результат — `app/dist/weebterebi.wgt`. Проверка Biome — `mise run lint`, форматирование — `mise run format`. Сборка также проверяет типы.

## Подключить отметки просмотра в Shikimori

1. В [OAuth-приложении Shikimori](https://shikimori.io/oauth/applications) укажите Redirect URI `urn:ietf:wg:oauth:2.0:oob` и разрешение `user_rates`.
2. Добавьте в `.env` значения `SHIKIMORI_CLIENT_ID` и `SHIKIMORI_CLIENT_SECRET`. Сборка также принимает `SHIKIMORI_CLIENT_SECRET_ID` как имя для секрета.
3. Соберите и установите приватный виджет. В меню телевизора выберите **Shikimori → Открыть Shikimori**.
4. Войдите на сайте Shikimori и разрешите доступ к списку. Вернитесь в виджет, введите выданный код и выберите **Подключить**.

Телевизор хранит и обновляет OAuth-токены локально. Главная показывает список подключённого профиля. Для анонимного просмотра публичного списка можно использовать `SHIKIMORI_USER_ID`.

Секрет OAuth-клиента входит в пакет `.wgt`. Храните эту сборку как приватную.
