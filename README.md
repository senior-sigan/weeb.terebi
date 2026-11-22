# Weeb Terebi

Просмотр аниме с сайта Anime365 на Samsung Tizen 5.5. 

## Development

Поместите `ACCESS_TOKEN=...` в файл `.env` в корне проекта. При сборке токен попадёт в локальный виджет.

```sh
mise install
mise run app:install
mise run electron:install
mise run electron
```

Команда `mise run tv:install` собирает виджет и запускает его на телевизоре по адресу из `app/package.json`. Отдельная сборка — `mise run build`, результат — `app/dist/weebterebi.wgt`. Проверка Biome — `mise run lint`, форматирование — `mise run format`. Сборка также проверяет типы.
