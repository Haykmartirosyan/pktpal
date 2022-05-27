<?php

namespace Deployer;

require 'recipe/laravel.php';
require 'recipe/rsync.php';


// Project name
set('application', 'my_project');

// Project repository
set('repository', 'git@github.com:pkteer/pktpal-web.git');

// [Optional] Allocate tty for git clone. Default value is false.
set('git_tty', true);

set('rsync_src', function () {
    return __DIR__; // If your project isn't in the root, you'll need to change this.
});

// Configuring the rsync exclusions.
// You'll want to exclude anything that you don't want on the production server.
add('rsync', [
    'exclude' => [
        '.git',
        '/.env',
        '/storage/',
        '/vendor/',
        '/node_modules/',
        '.github',
        'deploy.php',
    ],
]);


// Set up a deployer task to copy secrets to the server.
// Grabs the dotenv file from the github secret
task('deploy:secrets', function () {
    file_put_contents(__DIR__ . '/.env', getenv('DOT_ENV'));
    upload('.env', get('deploy_path') . '/shared');
    upload('storage/oauth-private.key', get('deploy_path') . '/shared/storage');
    upload('storage/oauth-public.key', get('deploy_path') . '/shared/storage');
});

// Shared files/dirs between deploys
add('shared_files', []);
add('shared_dirs', ['storage']);

$writable_dirs = [
    'bootstrap/cache',
    'storage',
    'storage/app',
    'storage/app/public',
    'storage/framework',
    'storage/framework/cache',
    'storage/framework/sessions',
    'storage/framework/views',
    'storage/logs',
];
// Writable dirs by web server
add('writable_dirs', [
    'bootstrap/cache',
    'storage',
    'storage/app',
    'storage/app/public',
    'storage/framework',
    'storage/framework/cache',
    'storage/framework/sessions',
    'storage/framework/views',
    'storage/logs',
]);

set('writable_mode', 'chmod');
set('writable_chmod_mode', '0777');

// Hosts

host('my.pktpal.com')
    ->hostname('51.161.117.162')
    ->stage('production')
    ->user('root')
    ->set('deploy_path', '/var/www/pktpal-web');

// Tasks
task('deploy', [
    'deploy:info',
    'deploy:prepare',
    'deploy:lock',
    'deploy:release',
    'rsync', // Deploy code & built assets
    'deploy:secrets', // Deploy secrets
    'deploy:shared',
    'deploy:vendors',
    'deploy:writable',
    'artisan:storage:link', // |
    'artisan:view:cache',   // |
    'artisan:config:cache', // | Laravel specific steps
    'artisan:optimize',     // |
    'artisan:migrate',      // |
    'deploy:symlink',
    'deploy:unlock',
    'cleanup',
]);

after('deploy', 'build');

desc('Build project after deploy');
task('build', [
    'composer:dump:autoload',
]);


task('composer:dump:autoload', function () {
    run('cd {{release_path}} && composer dump-autoload');
});

// [Optional] if deploy fails automatically unlock.
after('deploy:failed', 'deploy:unlock');

// Migrate database before symlink new release.

before('deploy:symlink', 'artisan:migrate');

