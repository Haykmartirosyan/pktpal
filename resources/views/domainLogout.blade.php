<script>

    function deleteAllCookies() {
        document.cookie.split(";").forEach(function (c) {
            if (c.includes('accessToken')) {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            }
            window.close()
        });
    }

    deleteAllCookies();

</script>
