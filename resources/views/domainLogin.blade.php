<script>

    @if(isset($accessToken) && isset($expires))

    function setCookie() {
        document.cookie = "accessToken={{$accessToken}}; expires={{$expires}}; path=/";
        window.close()
    }

    function deleteAllCookies() {
        document.cookie.split(";").forEach(function (c) {
            if (c.includes('accessToken')) {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            }
        });

        setCookie();
    }

    deleteAllCookies();

    @else
    window.close();

    @endif
</script>
