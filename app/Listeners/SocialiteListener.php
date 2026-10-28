<?php

namespace App\Listeners;

use SocialiteProviders\Authentik\AuthentikExtendSocialite;

class SocialiteListener
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(object $event): void
    {
        $event->extendSocialite('authentik', AuthentikExtendSocialite::class);
    }
}
