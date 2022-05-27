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
            <svg width="47" height="46" viewBox="0 0 47 46" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M32.2906 17.4224C33.1323 16.6379 33.1787 15.3197 32.3942 14.478C31.6097 13.6363 30.2914 13.5899 29.4498 14.3744L23.3536 20.0561L17.6719 13.96C16.8874 13.1183 15.5692 13.0719 14.7275 13.8564C13.8858 14.6409 13.8394 15.9592 14.6239 16.8009L20.3056 22.897L14.2095 28.5787C13.3678 29.3632 13.3214 30.6814 14.1059 31.5231C14.8904 32.3648 16.2087 32.4112 17.0504 31.6267L23.1465 25.945L28.8282 32.0411C29.6127 32.8828 30.931 32.9292 31.7726 32.1447C32.6143 31.3602 32.6607 30.0419 31.8762 29.2002L26.1945 23.1041L32.2906 17.4224Z"
                      fill="#EE152F"/>
                <path fill-rule="evenodd" clip-rule="evenodd"
                      d="M0.333496 23.0007C0.333496 10.3441 10.5936 0.0839844 23.2502 0.0839844C35.9067 0.0839844 46.1668 10.3441 46.1668 23.0007C46.1668 35.6572 35.9067 45.9173 23.2502 45.9173C10.5936 45.9173 0.333496 35.6572 0.333496 23.0007ZM23.2502 41.7506C12.8948 41.7506 4.50016 33.356 4.50016 23.0007C4.50016 12.6453 12.8948 4.25065 23.2502 4.25065C33.6055 4.25065 42.0002 12.6453 42.0002 23.0007C42.0002 33.356 33.6055 41.7506 23.2502 41.7506Z"
                      fill="#EE152F"/>
            </svg>

        </div>
        <h1>Please contact support</h1>

        <h2>{{request('reason') ? request('reason') : ''}}</h2>
    </div>
</div>
</body>
</html>





