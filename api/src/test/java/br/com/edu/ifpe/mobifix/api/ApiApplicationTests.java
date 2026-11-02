package br.com.edu.ifpe.mobifix.api;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@org.junit.jupiter.api.condition.EnabledIfSystemProperty(named = "mobifix.test.postgres", matches = "true")
@SpringBootTest
class ApiApplicationTests {

	@Test
	void contextLoads() {
	}

}
