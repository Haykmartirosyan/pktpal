<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="apple-touch-icon" href="{{asset('images/pwa/logo192.png')}}"/>
    <link rel="manifest" href="{{asset('manifest.json')}}"/>

    <title>PKT Pal</title>

    <!-- Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">

    <link rel="shortcut icon" href="{{asset('images/pkt-favicon.png')}}" type="image/x-icon">

    <!-- Styles -->
    <style>

        .fullscreenDiv {
            font-family: 'Nunito', sans-serif;
        }

        .centered {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
        }
    </style>
    <link href="{{ asset('css/app.css') }}" rel="stylesheet">

</head>
<body class="antialiased">
<div class='fullscreenDiv'>
    <div class="centered">
        <div class="d-flex justify-content-center mb-3">
            <svg width="51" height="50" viewBox="0 0 51 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.506 34.8038L11.8636 25.1615L15.0778 21.9473L21.506 28.3756L34.3625 15.5191L37.5766 18.7332L21.506 34.8038Z"
                      fill="#41db63"/>
                <path fill-rule="evenodd" clip-rule="evenodd"
                      d="M0.5 25C0.5 11.1929 11.6929 0 25.5 0C39.3071 0 50.5 11.1929 50.5 25C50.5 38.8071 39.3071 50 25.5 50C11.6929 50 0.5 38.8071 0.5 25ZM25.5 45.4545C14.2033 45.4545 5.04545 36.2967 5.04545 25C5.04545 13.7033 14.2033 4.54545 25.5 4.54545C36.7967 4.54545 45.9545 13.7033 45.9545 25C45.9545 36.2967 36.7967 45.4545 25.5 45.4545Z"
                      fill="#41db63"/>
            </svg>


        </div>
        <h1>Pairing successful</h1>

        <h2>This tab will close after 30 seconds</h2>
    </div>
</div>
<script>
    setTimeout(function () {
        location.href = '/dashboard'
    }, 30  * 1000)
</script>
</body>
</html>





