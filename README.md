## BLE-scale-reader

Interact with the [GOCLEVER BLE Kitchen Scale](http://goclever.com/waga-kuchenna-kitchen-smart-scale)

 * Read all properites from the device

Install
    $ npm install
    $ cordova run android
    

## Hardware description

Scale has built in BLE transmitter with disabled connectivity. It only advertises itself without pairing or connection option.
Characteristic parameters:

 * Name: TJLSCALE
 * Mac address: 28:32
 * All measurements are stored in advertising informations sent by the device.

Protocol description was reverse-engineered basing on phone with Android 6.0.
Main work pipeline will look like this:
* scan the BLE neighbour devices
* filter the list to scale-only-devices (prefferably basing on MAC address)
* read advertisement data and process it

## Protocol description

From the byte array obtained from advertisement data important data are those from 8th field to the 13th field.


| 1 | 2 | 3 | 4 | 5 | 6 |
|:---:|:---:|:---:|:---:|:---:|:---:|
| unit | function data | weight | weight | weight | weight |
| 0x01 | 0b____0000 | 0x1_ | 0x2_ | 0x3_ | 0x4_ |

Hint: _ means irrelevant data

### Unit

Each value is binded directly to the unit:

| value | unit |
| --- | --- |
| 1 | g |
| 2 | oz |
| 4 | oz:lb |
| 8 | ml |
| 16 | fl.oz |
| 20 | kg |

### Function data

4 youngest bits from value are responsible for signalization of different functions.

| bit number | function | 
| --- | --- |
| 0 | measurement is finished |
| 1 | scale is overloaded | 
| 2 | low battery |
| 3 | measurement is negative |

### Weight data

Four oldest bits from weight fields (3-6) concatenated together in hex notation are giving to total measurement. It depends of the unit if we need to recalculate result or not.

| unit | formula |
| --- | --- |
| g | f(x) = x |
| oz | f(x) = round(35.274 * x / 100) / 10 | 
| oz:lb | oz: f(x) = (3.5273962 * x / 100) / 16 
| | lb: f(x) = (3.5273962 * x / 100) - 16 * oz |
| ml | f(x) = x |
| fl.oz | f(x) = round(35.195 * e / 100) / 10 |
| kg | f(x) = x / 1000 |

Example:

Unit: kilograms

| 3 | 4 | 5 | 6 |
|:---:|:---:|:---:|:---:|
| 0x0F | 0x1F | 0x2F | 0x3F |

* take four older bits from hex notation and concatenate them: 0x0123
* number in decimal form: 291
* get the formula from the table and calculate the result: 291 / 1000 = 0.291 kg