# Changelog

This project adheres to [Semantic Versioning][semver].

## Unreleased

* Fix id generation

    Previously, sigver might generate an id encoded on 32bits instead of 31bits.
    Note that this was unlikely to happen since the id is randomly generated.


[semver]: https://semver.org/spec/v2.0.0.html
