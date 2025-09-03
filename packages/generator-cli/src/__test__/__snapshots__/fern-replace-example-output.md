# Basic Java Library

[![fern shield](https://img.shields.io/badge/%F0%9F%8C%BF-Built%20with%20Fern-brightgreen)](https://buildwithfern.com?utm_source=github&utm_medium=github&utm_campaign=readme&utm_source=Basic%2FJava)

The Basic Java library provides convenient access to the Basic APIs from Java.

## Installation

### Gradle

Add the dependency in your `build.gradle`:

```groovy
dependencies {
    implementation 'com.basic:imdb:1.2.3'
}
```

### Maven

Add the dependency in your `pom.xml`:

```xml
<dependency>
    <groupId>com.basic</groupId>
    <artifactId>imdb</artifactId>
    <version>1.2.3</version>
</dependency>
```

## Legacy SDK

While the new SDK has a lot of improvements, we at Square understand that it takes time to upgrade when there are breaking changes. 
To make the migration easier, the new SDK also exports the legacy SDK as `com.basic.imdb.legacy...`. Here's an example of how you 
can use the legacy SDK alongside the new SDK inside a single file:

```java
import com.basic.imdb.SquareClient;
import com.basic.imdb.core.Environment;

SquareClient imdb = 
        SquareClient.builder()
                .environment(Environment.PRODUCTION)
                .token("YOUR_TOKEN")
                .build();

com.basic.imdb.legacy.SquareClient legacyClient = 
        new com.basic.imdb.legacy.SquareClient.Builder()
                .environment(com.basic.imdb.legacy.Environment.PRODUCTION)
                .accessToken("YOUR_TOKEN")
                .build();
```

We recommend migrating to the new SDK using the following steps:

1. Include the following dependencies in your project

Gradle:
<div fern-replace="version:4.5.6">
```groovy
dependencies {
    implementation 'com.basic:imdb:4.5.6'
    implementation 'com.basic:imdb-legacy:4.5.6'
}
```
</div>

Maven:

<div fern-replace="version:4.5.6">
```xml
<dependency>
    <groupId>com.basic</groupId>
    <artifactId>imdb</artifactId>
    <version>4.5.6</version>
</dependency>
<dependency>
    <groupId>com.basic</groupId>
    <artifactId>imdb-legacy</artifactId>
    <version>4.5.6</version>
</dependency>
```
</div>

2. Search and replace all imports from `com.basic.imdb` to `com.basic.imdb.legacy`
3. Gradually move over to use the new SDK by importing it from the `com.basic.imdb` import

## Contributing

While we value open-source contributions to this SDK, this library is generated programmatically.
Additions made directly to this library would have to be moved over to our generation code,
otherwise they would be overwritten upon the next generated release. Feel free to open a PR as
a proof of concept, but know that we will not be able to merge it as-is. We suggest opening
an issue first to discuss with us!

On the other hand, contributions to the README are always very welcome!