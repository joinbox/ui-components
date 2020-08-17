# Audio

Audio component that consists of diffferent loosely coupled components that can (but must not) be
used together.

## Example

All components are independent from one another. It, however, makes sense, to use at least 
`<audio-component>` and `<media-play-pause-component>` to get a working component.

````html
<audio-component data-source="file_example_MP3_700KB.mp3" data-ready-class="ready">
    <media-play-pause-component data-playing-class="playing" data-paused-class="paused">
        ⏯
    </media-play-pause-component>
    <media-time-component>0:00</media-time-component>
    <media-timeline-component>
        <!-- Timeline component must include an input[type="range"] -->
        <input type="range" value="0">
    </media-timeline-component>
    <media-time-component data-type="total"> -:-- </media-time-component>
    🔉<media-volume-component>
        <!-- Volume component must include an input[type="range"] -->
        <input type="range" value="100">
    </media-volume-component>
</audio-component>

<!-- Import all components you use -->
<script src="AudioComponent.js"></script>
<script …>
````



## Components



### Audio Component

#### Exposed Element
`<audio-component></audio-component>`

#### Attriutes
- `data-source`: Path to the audio source file. It is only loaded when the user starts to play. 
Attribute must be set when the element is created as it is consumed by the element's constructor.
- `data-ready-class`: Class name that will be added to the element as soon as audio file was loaded
and is ready to be played back.

#### Properties
- `audio` instance of HTMLAudioElement that is used to play the audio.



### Play Pause Component

#### Exposed Element
`<play-pause-component></play-pause-component>`

#### Attriutes
- `data-playing-class`: Class name that is added to the element when it is playing.
- `data-paused-class`: Class name that is added to the element when it is paused.

#### Methods
- `toggle()` toggles between play and pause.



### Audio Time Component

#### Exposed Element
`<audio-time-component></audio-time-component>`

#### Attriutes
- `data-type`: either `current` to display the current playback time or `total` to display the
audio's total duration. Defaults to `current`.



### Volume Component

#### Exposed Element
`<volume-component><input type="range"></volume-component>`

`input` of `type` `range` is needed and the actual UI element.



### Timeline Component

#### Exposed Element
`<timeline-component><input type="range"></timeline-component>`

`input` of `type` `range` is needed and the actual UI element.

